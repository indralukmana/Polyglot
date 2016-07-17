// SETUP

var express    = require('express');
var bodyParser = require('body-parser');

var newVector     = require('./newVector');
var newTranslate    = require('./newTranslation');
var newTranscription    = require('./newTranscription');

var websiteAddress = "http://localhost:8080";

var vectorURL = websiteAddress.concat("/api/vectors/");
var transcriptionURL = websiteAddress.concat("/api/transcriptions/");
var translationURL = websiteAddress.concat("/api/translations/");

//ROUTE FUNCTIONS

var replaceChildText = function(oldText, newInsert, oldInsert) {

    var StartIndex = oldText.indexOf(oldInsert);
    startHTML = oldText.slice(0, StartIndex).concat(newInsert);

    var EndIndex = oldText.indexOf(oldInsert) + oldInsert.length;
    endHTML = oldText.substring(EndIndex);

    var newText = startHTML + endHTML;
    return newText;
};

//basically the rank will currently only change if it outranks above or below existing
//produces array where 
//first is rank change made to current child
//second is the index of relevant neighbour to be swapped
//third is rank change made to relevant neighbour

var compareChild = function(vote, alternative, index, currentArray) {

    var rankChange;
    if(vote>0) {
        var indexUp = index -1;
        if (indexUp >= 0) {
            var upChild = currentArray[indexUp];
            var upChildNet = upChild.votesUp - upChild.votesDown;
            var currentNet = 1 + alternative.votesUp - alternative.votesDown;
            if (currentNet > upChildNet) {
                rankChange = [-1, indexUp, 1];
            }
            else {rankChange = [0,indexUp,0]};
        }
        else {
            rankChange = [0,indexUp,0];
        };
    }

    else if (vote<0) {
        var indexDown = index +1;
        var downChild = currentArray[indexDown];
        var downChildNet = downChild.votesUp - downChild.votesDown;
        var currentNet = alternative.votesUp - alternative.votesDown - 1;
        if (currentNet < upChildNet) {
            rankChange = [1, indexDown, -1];
        }
        else {rankChange = [0, indexDown, 0]};
    }

    else {
        return false;
    };
    return rankChange;
};

exports.voting = function(req, res) {

    var voteOn = newTranscription.findOne({'body.id':req.body.parent});
    voteOn.exec(function(err, transcription) {

        if (err) {res.send(err)}

        else {

            var reload;

            console.log("the span id sent is "+req.body.children[0].id);

            transcription.children.forEach(function(location){
                console.log("the parents child spans "+location.id);
                if (location.id == req.body.children[0].id) {
                    console.log("the parent span's fragments are "+JSON.stringify(location.fragments));
                    location.fragments.forEach(function(alternative, index, currentArray){
                        if(alternative.id == req.body.children[0].fragments[0].id) {
                            var oldRank = alternative.rank;
                            var rankChange;
                            if (req.params.voteType == "up") {
                                rankChange = compareChild(1, alternative, index, currentArray);
                                alternative.votesUp += 1;
                            };
                            if (req.params.voteType == "down") {
                                rankChange = compareChild(-1, alternative, index, currentArray);
                                alternative.votesUp -= 1;
                            };
                            var currentRank = oldRank + rankChange[0];
                            alternative.rank = currentRank;
                            /////
                            if (typeof location.fragments[rankChange[1]] != (null || 'undefined')) {
                                location.fragments[rankChange[1]].rank += rankChange[2]; //////
                            };
                            //check to see if now highest ranking child and update
                            if ((oldRank != 0) && (currentRank == 0)){ 
                                var oldHTML = transcription.body.text;
                                var newInsert = req.body.votedText;
                                var oldInsert = req.body.topText;
                                transcription.body.text = replaceChildText(oldHTML, newInsert, oldInsert);
                                reload = "yes";
                            }
                            else {
                                reload = "no";
                            };
                        };
                    });
                };
            });

            transcription.save(function(err) {
                if (err) {res.send(err)}
                else {  res.json({"reloadText": reload});   }
            });

        };

    });

};

exports.findAll = function(req, res) {
    newTranscription.find(function(err, transcriptions) {
        if (err)
            res.send(err);

        res.json(transcriptions);
    });

};

exports.deleteAll = function(req, res) {
      
    newTranscription.find(function(err, transcriptions) {
        if (err) {res.send(err)};

        transcriptions.forEach(function(transcription){
            newTranscription.remove({_id: transcription._id},
            function(err){
                if (err) {res.send(err)};
            })
        });

        res.send("all gone");
    }); 
};

exports.addNew = function(req, res) {
    
    var transcription = new newTranscription(); 

    var newTransID = transcription.id;
    var transURL = transcriptionURL.concat(newTransID);
    console.dir(req.body);

    transcription.body.text = req.body.body.text;
    transcription.body.id = transURL;
    transcription.body.format = req.body.body.format;

    if (typeof req.body.body.language != 'undefined' || req.body.body.language != null) {
        transcription.body.language = req.body.body.language;
    };

    req.body.target.forEach(function(newTarget){
        transcription.target.push(
            {"id": newTarget.id,
            "format": newTarget.format}
        );
    });

    if (typeof req.body.metadata != 'undefined' || req.body.metadata != null) {
        transcription.metadata.push(req.body.metadata);
    };

    if (typeof req.body.parent != 'undefined' || req.body.parent != null) {
        transcription.parent = req.body.parent;
    };

    if (typeof req.body.children != 'undefined' || req.body.children != null) {

        transcription.children.forEach(function(location){
            if (location.id == req.body.children.id) {
                location.fragments.push({
                        "id": req.body.children.fragments.id,
                        "votesUp": 0,
                        "votesDown": 0,
                        "rank": 0
                    });
            }
            else {
                transcription.children.push({
                    "id": req.body.children.id,
                
                    "fragments": [{
                        "id": req.body.children.fragments.id,
                        "votesUp": 0,
                        "votesDown": 0,
                        "rank": 0
                    }]
                });
            };
        });
    };

    transcription.save(function(err) {
        if (err)
            res.send(err);
    });

    res.json({ "url": transURL });

};

exports.getByID = function(req, res) {
    newTranscription.findById(req.params.transcription_id, function(err, transcription) {
        if (err) {res.send(err) }
        else { res.json(transcription) };  
    });
};

////IMPORTANT NOTE: use updateOne to add new children but NOT to change vote or rank!

exports.updateOne = function(req, res) {

    console.dir(req.body);

    var updateDoc = newTranscription.findById(req.params.transcription_id);
    updateDoc.exec(function(err, transcription) {

        if (err) {res.send(err)};

        if (typeof req.body.body != 'undefined' || req.body.body != null) {

            if (typeof req.body.body.text != 'undefined' || req.body.body.text != null) {
                transcription.body.text = req.body.body.text;
            };

            if (typeof req.body.body.language != 'undefined' || req.body.body.language!= null) {
                transcription.body.language = req.body.body.language;
            };

            if (typeof req.body.body.format != 'undefined' || req.body.body.format!= null) {
                transcription.body.format = req.body.body.format;
            };
        };

        if (typeof req.body.parent != 'undefined' || req.body.parent != null) {
            transcription.parent = req.body.parent;
        };

        if (typeof req.body.metadata != 'undefined' || req.body.metadata != null) {
            vector.metadata.push(req.body.metadata);
        };

        if (typeof req.body.children[0] != 'undefined' || req.body.children[0] != null) {

            if (typeof transcription.children[0] != 'undefined' || transcription.children[0] != null) {

                transcription.children.forEach(function(location){
                    if (location.id == req.body.children.id) {
                        var newRank = location.fragments.length;
                        location.fragments.push({
                                "id": req.body.children.fragments[0].id,
                                "votesUp": 0,
                                "votesDown": 0,
                                "rank": newRank
                            });
                    }
                    else {
                        req.body.children.forEach(function(location){
                            console.dir(location.fragments[0].id);
                            transcription.children.push({
                                "id": location.id,
                            
                                "fragments": [{
                                    "id": location.fragments[0].id, ///isn't going in with the rest of it....
                                    "votesUp": 0,
                                    "votesDown": 0,
                                    "rank": 0
                                }]
                            });
                            
                        });
                    };
                });
            }

            else {

                req.body.children.forEach(function(location){
                    console.dir(location.fragments[0].id);
                    transcription.children.push({
                        "id": location.id,
                    
                        "fragments": [{
                            "id": location.fragments[0].id, ///isn't going in with the rest of it....
                            "votesUp": 0,
                            "votesDown": 0,
                            "rank": 0
                        }]
                    });
                    
                });

            };
        };

        transcription.save(function(err) {
            if (err) {res.send(err)};
            res.json(transcription);
        });

    });

};


exports.deleteOne = function(req, res) {
        newTranscription.remove({
            _id: req.params.transcription_id
        }, 
        function(err, transcription) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
};

var asyncPush = function(addArray, oldArray) {
    var i;
    var theArray = oldArray;
    theArray.then(function(theArray) {
        addArray.forEach(function(addDoc){
            theArray.push(addDoc);
        });
        if (theArray.length = (oldArray.length + addArray.length)) {
            return theArray;
        };
    });
};

var generateVoteJSON = function(fragmentChild, theJSON) {
    ///adds new field before returning
    var voteDoc = {"votingInfo" : fragmentChild};
    var theText = [];
    return theText
        .then(asyncPush([theJSON], theText))
        .then(asyncPush([voteDoc], theText));
};

///only for searchArrays where childDoc.id is to compare with checkID
var idMatching = function(searchArray, checkID) {
    searchArray.forEach(function(childDoc){
        if (childDoc.id == checkID) {
            return childDoc;
        };
    });
};

var arrayIDCompare = function(arrayA, arrayB) {

    arrayA.forEach(function(doc){
        var theCheck = idMatching(arrayB, arrayA.id);
        if (typeof theCheck == (null || 'undefined' || false)) {}
        else {
            return [doc, theCheck];
        };
    });

};

var foundParent = function(textParent, spanID, textArray, fragmentsArray) {

    var spanLocation;
    var fragmentChild;
    var theJSON;
    var theText;

    textParent.then(function(textParent) {
        spanLocation = idMatching(textParent.children, spanID)}
        ).then(function(spanLocation) {
            var compareArray = arrayIDCompare(textArray, spanLocation.fragments);
            theJSON = compareArray[0];
            fragmentChild = compareArray[1];
        }).then(function(theJSON, fragmentChild) {
            theText = generateVoteJSON(fragmentChild, theJSON);
        }).then(function(theText){
            return fragmentsArray.push(theText);
        });
};

var votingInfoTexts = function(targetID, textArray) {

    var fragmentsArray = [];
    var parts = targetID.split("#", 2); //////this will work with first two not last two.....
    var parentID = parts[0];
    var spanID = parts[1];
    newTranscription.findOne({'body.id': parentID}, function(err, textParent){
        if (err) { 
            return fragmentsArray.then(asyncPush(textArray, fragmentsArray));
        }
        else {
            return fragmentsArray.foundParent(textParent, spanID, textArray, fragmentsArray);
        };
    });
};

exports.getByTarget = function(req, res) {

    var targetID = req.params.target;
    var theSearch = newTranscription.find({'target.id': targetID});

    theSearch.exec(function(err, texts){

        if (err) {
            console.log(err);
            res.json({list: false});
        }
        else if (targetID.includes("#")==true) {
            var textWithVotes = votingInfoTexts(targetID, texts); 
            textWithVotes.then(function(textWithVotes){
                console.log("the textWithVotes is "+JSON.stringify(textWithVotes));
                res.json({list: textWithVotes});
            });
        }
        else {
            var textAnnos = [];
            ///add array brackets around each object in texts...
            var thePush = asyncPush(texts, textAnnos);
            thePush.then(function(thePush){
                res.json({list: textAnnos});
            });
        };
    });

};



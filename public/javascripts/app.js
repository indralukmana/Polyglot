

var currentWebsite = window.location.href;
//alert(currentWebsite);

var websiteAddress = "http://localhost:8080";

var vectorURL = websiteAddress.concat("/api/vectors/");
var transcriptionURL = websiteAddress.concat("/api/transcriptions/");
var translationURL = websiteAddress.concat("/api/translations/");

//info.json format URL
var imageSelected;
var imageSelectedFormats;
var imageSelectedMetadata = [];

//API URL
var vectorSelected = "";
var currentCoords;

//API URL
var textSelected = "";
//API URL
var textSelectedParent = "";
//DOM id
var textSelectedID;
//parent API URL + ID
var textSelectedHash;
//HTML Selection Object
var textSelectedFragment = "";
var textSelectedFragmentString = "";
var textTypeSelected = "";

//URL
var targetSelected = "";
var targetType = ""; 

//Boolean to indicate if the currently selected text already has children or not
var childrenText = false;
//used to indicate if the user is currently searching for a vector to link or not
var selectingVector = "";

var findingcookies = document.cookie;

///// TEXT SELECTION

var outerElementTextIDstring;
var newContent;
var newNodeInsertID;
var startParentID;

//based on the code from https://davidwalsh.name/text-selection-ajax

// attempt to find a text selection 
function getSelected() {
  if(window.getSelection) { return window.getSelection() }
  else if(document.getSelection) { return document.getSelection(); }
  else {
    var selection = document.selection && document.selection.createRange();
    if(selection.text) { return selection.text; }
    return false;
  }
  return false;
};

// create sniffer 
$(document).ready(function() {
  $('.content-area').mouseup(function(event) {

    selection = getSelected(); 
    textSelectedFragment = selection;

    if(textSelectedFragment && (textSelectedFragment = new String(textSelectedFragment).replace(/^\s+|\s+$/g,''))) {
      textSelectedFragmentString = textSelectedFragment.toString();
    };

    var startNode = selection.anchorNode; // the text type Node that the beginning of the selection was in
    var startNodeText = startNode.textContent; // the actual textual body of the startNode - removes all html element tags contained
    var startNodeTextEndIndex = startNodeText.toString().length;
    startParentID = startNode.parentElement.id;
    var startParentClass = startNode.parentElement.className;

    var nodeLocationStart = selection.anchorOffset; //index from within startNode text where selection starts
    var nodeLocationEnd = selection.focusOffset; //index from within endNode text where selection ends

    var endNode = selection.focusNode; //the text type Node that end of the selection was in 
    var endNodeText = endNode.textContent;
    var endParentID = endNode.parentElement.id; //the ID of the element type Node that the text ends in

    outerElementTextIDstring = "#" + startParentID; //will be encoded URI of API?

    //only checking here so that other info can still be accessed from reopening
    if (startParentClass.includes('openTranscriptionChildrenPopup')) { 
      $("#popupTranscriptionChildrenMenu").popup("open");
    }
    else if (startParentClass.includes('openTranslationChildrenPopup')) { 
      $("#popupTranslationChildrenMenu").popup("open");
    }
    else if (startParentID != endParentID) {
      alert("you can't select across existing fragments' borders sorry");
    }
    else {

      var newSpanClass;
      var newPopupMenu;
      if (startParentClass.includes('transcription-text')) {
        newSpanClass = "transcription-text openTranscriptionChildrenPopup";
        newPopupMenu = "#popupTranscriptionNewMenu";
      }
      else if (startParentClass.includes('translation-text')) {
        newSpanClass = "translation-text openTranslationChildrenPopup";
        newPopupMenu = "#popupTranslationNewMenu";
      }
      else {
        alert("Please select transcription translation text");
      };

      var newIDnumber = Math.random().toString().substring(2);
      newNodeInsertID = startParentID.concat("-location-"+newIDnumber); //not a standardised selection label but will do for now

      var newSpan = "<a class='" + newSpanClass + "' id='" + newNodeInsertID + "' >" + textSelectedFragment + "</a>";
   
      var outerElementHTML = $(outerElementTextIDstring).html().toString(); //includes any spans that are contained within this selection 

      ///CONTENT BEFORE HIGHLIGHT IN THE TEXT TYPE NODE
      var previousSpanContent = startNodeText.slice(0, nodeLocationStart);

      //CONTENT BEFORE HIGHLIGHT IN THE ELEMENT TYPE NODE
      var previousSpan = startNode.previousElementSibling; //returns null if none i.e. this text node is first node in element node
      var outerElementStartContent;
      if (previousSpan == "null" || previousSpan == null) {outerElementStartContent = previousSpanContent}
      else {
        var previousSpanAll = previousSpan.outerHTML;
        var StartIndex = outerElementHTML.indexOf(previousSpanAll) + previousSpanAll.length;
        outerElementStartContent = outerElementHTML.slice(0, StartIndex).concat(previousSpanContent);
      };

      ///CONTENT AFTER HIGHLIGHT IN THE TEXT TYPE NODE
      var nextSpanContent;
      if (endNode == startNode) { nextSpanContent = startNodeText.slice(nodeLocationEnd, startNodeTextEndIndex)}
      else {nextSpanContent = endNodeText.slice(0, nodeLocationEnd)};

      ///CONTENT AFTER HIGHLIGHT IN ELEMENT TYPE NODE
      var nextSpan = endNode.nextElementSibling; //returns null if none i.e. this text node is the last in the element node
      var outerElementEndContent;
      if (nextSpan == "null" || nextSpan == null) {outerElementEndContent = nextSpanContent}
      else {
        var nextSpanAll = nextSpan.outerHTML;
        var EndIndex = outerElementHTML.indexOf(nextSpanAll);
        outerElementEndContent = nextSpanContent.concat(outerElementHTML.substring(EndIndex));
      };

      newContent = outerElementStartContent + newSpan + outerElementEndContent;
      $( newPopupMenu ).popup( "open");

    };

  });
});

var insertSpanDivs = function() {
  $(outerElementTextIDstring).html(newContent); 
  textSelectedID = newNodeInsertID;
};

var newTranscriptionFragment = function() {

  textSelectedHash = textSelectedParent.concat(".body.text#"+textSelectedID); //need to refer specifically to body text of that transcription - make body independent soon so no need for the ridiculously long values??
  var targetData = {body: {text: textSelectedFragmentString, format: "text/html"}, target: {id: textSelectedHash, format: "text/html"}, parent: textSelectedParent};
  
  $.ajax({
    type: "POST",
    url: transcriptionURL,
    async: false,
    data: targetData,
    success: 
      function (data) {
        textSelected = data.url;
        targetSelected = data.url;
      }
  });

  var newHTML = $(outerElementTextIDstring).html();
  var parentData = {body: {text: newHTML}};

  $.ajax({
    type: "PUT",
    url: textSelectedParent,
    async: false,
    dataType: "json",
    data: parentData,
    success:
      function (data) {}
  });

};

var findClassID = function(classString, IDstring) {
  var IDindex = classString.search(IDstring) + IDstring.length;
  var IDstart = classString.substring(IDindex);
  var theID = spanIDstart.split(" ", 1);
  return theID[0];
};

///// API FUNCTIONS

var getTargetJSON = function(target) {

  var targetJSON;

  $.ajax({
  type: "GET",
  dataType: "json",
  url: target,
  async: false,
  success: 
    function (data) {
      targetJSON = data;
    }
  });

  return targetJSON;
};

var searchCookie = function(cookiestring, field) {
  var searchTerm = field;
  var fieldIndex = cookiestring.lastIndexOf(searchTerm);
  if (fieldIndex == -1) {
    return false;
  }
  else {
    var postField = cookiestring.substring(fieldIndex+searchTerm.length);
    var theValueEncoded = postField.split(";", 1);
    var theValue = theValueEncoded[0];
    return theValue;
  };
};

var getBodyText = function(target) {
  var bodyText = getTargetJSON(target);
  var theText = bodyText.body.text;
  return theText;
};

var checkForVectorTarget = function(theText) {
  var isThere = "false";
  var theChecking = getTargetJSON(theText);
  var theTargets = theChecking.targets;
  theTargets.forEach(function(target){
    if(target.format == "SVG"){
      isThere = target.id;
    };
  });
  return isThere;
};

var checkForTranscription = function(target) {

  var targetChecking = getTargetJSON(target);
  var targetTranscription = targetChecking.transcription;

  if (targetTranscription == '""') {  return false  }
  else if (targetTranscription == "") {  return false  }

  else {  return targetsTranscription  };

};

var checkForTranslation = function(target) {

  var targetChecking = getTargetJSON(target);
  var targetTranslation = targetChecking.translation;

  if (targetTranslation == '""') {  return false  }
  else if (targetTranslation == "") {  return false }

  else {  return targetTranslation  };

};

var checkForParent = function(target) {

  var targetChecking = getTargetJSON(target);
  var parent = targetChecking.parent;

  if (parent == '""') { return false }
  else if (parent == "") {  return false }
  else if (parent == false) {  return false }

  else {  return parent   };

};

var lookupTranscriptionChildren = function(target) {

  var childTexts
  var targetParam = encodeURIComponent(target);
  var aSearch = transcriptionURL.concat("targets/"+targetParam);
  $.ajax({
    type: "GET",
    dataType: "json",
    url: aSearch,
    async: false,
    success: 
      function (data) {
        childTexts = data.list;
      }
  });
  return childTexts;

};

var updateVectorSelection = function(vectorURL) {

  var textData = {target: {id: vectorURL, format: "SVG"}};
  var vectorData;
  if (textTypeSelected == "transcription") {  vectorData = {transcription: textSelected};  }
  else if (textTypeSelected == "translation") {  vectorData = {translation: textSelected};  };

  $.ajax({
    type: "PUT",
    dataType: "json",
    url: textSelected,
    async: false,
    data: textData,
    success: 
      function (data) {};
  });

  $.ajax({
    type: "PUT",
    dataType: "json",
    url: vectorURL,
    async: false,
    data: vectorData
    success: 
      function (data) {
        selectingVector = "";
      }
  }); 

};

var votingFunction = function(vote, votedID, spanID, parentID, currentTopText) {

  var theVote;
  var targetID; ///API URL of the annotation voted on
  var outerSpan;
  if (targetType == "transcription"){
    theVote = transcriptionURL + "voting/" + vote;
    targetID = transcriptionURL.concat(votedID);
    outerSpanOpen = "<a class='transcription-text openTranscriptionChildrenPopup' id='"+ spanID + "' >";
  } 
  else if (targetType == "translation"){
    theVote = translationURL + "voting/" + vote;
    targetID = translationURL.concat(votedID);
    outerSpanOpen = "<a class='translation-text openTranslationChildrenPopup' id='"+ spanID + "' >";
  };
  var idString = "#" + spanID;

  var votedTextBody = $(votedID).html(); 
  var currentText = outerSpanOpen + currentTopText + "</a>"; ///current most voted at that location, includes outerHTML
  var votedText = outerSpanOpen + votedTextBody + "</a>"; ///text just voted on, includes outerHTML

  var targetData = {
    parent: parentID, ///it is this that is updated containing the votedText within its body
    children: {
      id: idString, //ID of span location
      fragments: {
        id: targetID,
      }
    },
    votedText: votedText,
    topText: topText
  };

  $.ajax({
    type: "PUT",
    url: theVote,
    async: false,
    dataType: "json",
    data: targetData,
    success:
      function (data) {}
  });

};

var buildCarousel = function(childrenArray, baseURL, carouselWrapperID, canItLink) {

  var existingChildren = childrenArray; //an array of all the children JSONs
  if (typeof existingChildren != false || existingChildren != 'undefined' || existingChildren != null) {
    var openingHTML = "<div class='item pTextDisplayItem'><div class='pTextDisplay'><div><blockquote id='";
    var middleHTML = "' class='content-area'>";

    var endTextHTML = "</blockquote><br>";
    var voteButtonsHTML = "<button type='button' class='btn voteBtn votingUpButton'>+1</button><button type='button' class='btn voteBtn votingDownButton'>-1</button><br>";
    var linkButtonHTML = "<button type='button' class='btn linkBtn'>Link Vector</button><br>";

/////////need to add metadata options!!!
    var metadataHTML = " ";

    var endDivHTML = "</div></div></div>";
    if (canItLink == false){linkButtonHTML = " "};
    var closingHTML = endTextHTML + voteButtonsHTML + linkButtonHTML + metadataHTML + endDivHTML;

    existingChildren.forEach(function(text) {
      var itemText = text.body.text;
      var theURL = text.body.id;
      var itemID = theURL.slice(baseURL.length, theURL.length);
      var itemHTML = openingHTML + itemID + middleHTML + itemText + closingHTML;
      $(carouselWrapperID).append(itemHTML);
/////////update metadata options with defaults and placeholders???    
      alert("appending item");
    });
  };

};

////IMAGE HANDLING

var loadImage = function(cookiestring) {

  imageSelected = searchCookie(cookiestring, "imageviewing=");
  var theImage = getTargetJSON(imageSelected);
  imageSelectedFormats = theImage.formats;
  imageSelectedMetadata = theImage.metadata;

};

var getImageVectors = function(target) {
  var imageVectors;
  var targetParam = encodeURIComponent(target);
  var imageSearch = vectorURL.concat("targets/"+targetParam);
  $.ajax({
    type: "GET",
    dataType: "json",
    url: imageSearch,
    async: false,
    success: 
      function (data) {
        imageVectors = data.list;
      }
  });
  return imageVectors;
};

///// VIEWER WINDOWS

var openTranscriptionMenu = function() {

  var targetsTranscription;
  //the most popular text HTML ID
  var theText;
  var canUserAdd;
  var canUserVote;
  var canUserLink;
  var childrenArray;

  var parentID = "parentID-"+textSelectedParent.slice(transcriptionURL.length, textSelectedParent.length);
  var spanID = "spanID-"+textSelectedID;

  var carouselID = "carouselID-";

  //currently hardcoded for dev but will be generated from creating new editor window
  var newCarouselWrapperID = "#transcriptionCarouselWrapper"; 

  ///generate new popup window and add carousel html with ID

  if (targetType == "vector"){

    var carouselClassID = vectorSelected.slice(vectorURL.length, vectorSelected.length);
    $(newCarouselWrapperID).addClass('vector-target vectorID'+carouselClassID);

    targetsTranscription = checkForTranscription(vectorSelected);
    canUserLink = false;
    if (targetsTranscription == false) {
      var displayText = " [[[[NO TRANSCRIPTION EXISTS HERE YET]]]] "; //think of something more formal here....
      theText = "noTranscriptionToDisplay";
      var displayID = transcriptionURL.concat(theText);
      childrenArray = [{body: {id: displayID, text: displayText}}];
      canUserAdd = true;
      canUserVote = false;
    }
    else {
      var theTextURL = targetTranscription.id;
      theText = theTextURL.slice(transcriptionURL.length, theTextURL.length);
      childrenArray = lookupTranscriptionChildren(vectorSelected);
      //if the transcription has a parent then you can vote between and add because it will also have a transcription target
      if (checkForParent(targetTranscription) != false) { 
        canUserAdd = true; 
        canUserVote = true; 
      }
      //if it doesn't have a parent then it shouldn't have any siblings, only children
      else { 
        canUserAdd = false; 
        canUserVote = false; 
      };
    };
  }
  else if (targetType == "transcription"){
    $(newCarouselWrapperID).addClass('transcription-target transcriptionID'+textSelectedID);
    canUserAdd = true;
    canUserVote = true;
    theText = textSelected.slice(transcriptionURL.length, textSelected.length);
    checkVectors = checkForVectorTarget(textSelected); 
    //if there is a vector target already they cannot link
    if (checkVectors != "false"){
      canUserLink = false;
      var carouselClassID = vectorSelected.slice(vectorURL.length, vectorSelected.length);
      $(newCarouselWrapperID).addClass('vector-target vectorID'+carouselClassID);
    }
    else {
      canUserLink = true;
    };
    childrenArray = lookupTranscriptionChildren(textSelectedHash);
  }
  else { alert("what are you opening transcription of?") };

  buildCarousel(childrenArray, transcriptionURL, newCarouselWrapperID, canUserLink);
  $(newCarouselWrapperID).find(*).addClass("transcription-text "+parentID+" "+spanID);

  //emphasise theText as the current highest voted -- choose better styling later
  $(theText).css("background-color", "blue");
  $(theText).parent().parent().parent().addClass("active"); //ensures it is the first slide people see
  $(theText).addClass("currentTop");
  $(theText).parent().parent().append("<h2>Most Popular</h2>");

  if (canUserAdd == false) {
    //disable the add new slide
  };
  if (canUserVote == false) {
    $(theText).siblings(".voteBtn").remove();
  };

};

var closeTranscriptionMenu = function(carouselWrapperID) {

  //check if add new slide is disabled and reenable

//detach() or remove() ????
  $(".pTextDisplayItem").filter(function(){
    return this.parent().attr("id") == carouselWrapperID;
  }).remove();

};

var openTranslationMenu = function() {

};


///// TRANSLATION AND TRANSCRIPTION FUNCTIONS

var linkVectorTranscription = function(target){

      textSelected = target;
      selectingVector = "transcription";

    //highlight or emphasise image viewer

};

var linkVectorTranslation = function(target) {

};

var addTranscription = function(target){

  //the id is currently hardcoded for dev but will be generated for the editor open
  var newText = $("#newTranscription").val();
  var createdTranscription;
  var transcriptionData;
  var targetDataJSON;

  if (targetType == "vector") {
    transcriptionData = {body: {text: newText, format: "text"}, target: {id: target, format: "image/SVG"}};
  }

  else if (targetType == "transcription") {
    transcriptionData = {body: {text: newText, format: "text"},target: {id: textSelectedHash, format: "text/html"},parent: textSelected};
  }

  else {
    alert("What are you adding the transcription of?");
  };

  $.ajax({
    type: "POST",
    url: transcriptionURL,
    async: false,
    data: transcriptionData,
    success: 
      function (data) {
        createdTranscription = data.url;
      }
  });

  $("#newTranscription").val(""); //reset

  if (targetType == "vector") {
    targetData = {transcription: createdTranscription};
  }
  else if (targetType == "transcription") {
    targetData = {children: {id: textSelectedID, fragments: {id: createdTranscription}}};
  }; 

  $.ajax({
    type: "PUT",
    url: target,
    async: false,
    data: targetData,
    success:
      function (data) {}
  });

  newText = "";
  openTranscriptionMenu();

};

//ADD TRANSLATION OPTION
var addTranslation = function() {

};

///////LEAFLET 

loadImage(findingcookies);
var map;
var baseLayer;
var allDrawnItems = new L.FeatureGroup();
var controlOptions = {
    draw: {
//disables the polyline and marker feature as this is unnecessary for annotation of text as it cannot enclose it
        polyline: false,
        marker: false,
//disabling polygons and circles as IIIF image region API does not specify how to encode anything but rectangular regions
        polygon: false,
        circle: false
    },
//passes draw controlOptions to the FeatureGroup of editable layers
    edit: {
        featureGroup: allDrawnItems,
    }
};
var popupVectorMenu = L.popup()
    .setContent('<a href="#transcriptionEditor" data-rel="popup" data-position-to="#ViewerBox1" data-transition="fade" class="openTranscriptionMenu ui-btn ui-corner-all ui-shadow ui-btn-inline">TRANSCRIPTION</a><br><a href="#translationEditor" data-rel="popup" data-position-to="#ViewerBox1" data-transition="fade" class="openTranscriptionMenu ui-btn ui-corner-all ui-shadow ui-btn-inline">TRANSLATION</a>');
//to track when editing
var currentlyEditing = false;
var currentlyDeleting = false;
var existingVectors = getImageVectors(imageSelected);

map = L.map('map');
map.options.crs = L.CRS.Simple;
map.setView(
  [0, 0], //centre coordinates
  0 //zoom needs to vary according to size of object in viewer but whatever
);
map.options.crs = L.CRS.Simple;
baseLayer = L.tileLayer.iiif(imageSelected);
map.addLayer(baseLayer);
map.addLayer(allDrawnItems);
new L.Control.Draw(controlOptions).addTo(map);

map.whenReady(function(){
  mapset = true;
});

//load the existing vectors
if (existingVectors != false) {
  existingVectors.forEach(function(vector) {

    var oldData = {
        "type": "Feature",
        "properties":{},
        "geometry":{
          "type": vector.notFeature.notGeometry.notType,
          "coordinates": [vector.notFeature.notGeometry.notCoordinates]
        }
      };

    var existingVectorFeature = L.geoJson(oldData, {
      onEachFeature: function (feature, layer) {
        layer._leaflet_id = vector.body.id,
        allDrawnItems.addLayer(layer),
        layer.bindPopup(popupVectorMenu)
      }

    }).addTo(map);

  });
};


////whenever a new vector is created within the app
map.on('draw:created', function(evt) {

	var layer = evt.layer;
  var shape = layer.toGeoJSON();

	allDrawnItems.addLayer(layer);

//check for parents of created vector and if so then add to targetData

  var targetData = {geometry: shape.geometry, target: {id: imageSelected, formats: imageSelectedFormats}, metadata: imageSelectedMetadata};

  $.ajax({
    type: "POST",
    url: vectorURL,
    async: false,
    data: targetData,
    success: 
      function (data) {
        vectorSelected = data.url;
        targetSelected = data.url;
        targetType = "vector";
      }
  });

  layer._leaflet_id = vectorSelected;
  layer.bindPopup(popupVectorMenu).openPopup();

    if (selectingVector != "") {
      updateVectorSelection(vectorSelected);
    }

});

/////whenever a vector is clicked
allDrawnItems.on('click', function(vec) {

  vectorSelected = vec.layer._leaflet_id;
  targetSelected = vec.layer._leaflet_id;
  targetType = "vector";
//  alert(targetSelected);

  if ((currentlyEditing == true) || (currentlyDeleting == true)) {}

  else {

    if (selectingVector == "") {
      vec.layer.openPopup();
    }
    else {
      updateVectorSelection(vectorSelected);
    }
  };

});

map.on('draw:deletestart', function(){
  currentlyDeleting = true;
});
map.on('draw:deletestop', function(){
  currentlyDeleting = false;
});
map.on('draw:editstart', function(){
  currentlyEditing = true;
});
map.on('draw:editstop', function(){
  currentlyEditing = false;
});

//////update DB whenever vector coordinates are changed
allDrawnItems.on('edit', function(vec){

  var shape = vec.layer.toGeoJSON();

  $.ajax({
    type: "PUT",
    url: vectorSelected,
    async: false,
    data: shape,
    success:
      function (data) {}
  });

});

//////update DB whenever vector is deleted
allDrawnItems.on('remove', function(vec){

  $.ajax({
    type: "DELETE",
    url: vectorSelected,
    success:
      function (data) {}
  });

});

map.on('popupopen', function() {

  $('.openTranscriptionMenu').one("click", function(event) {
    openTranscriptionMenu();
    map.closePopup();
  });

  $('.openTranslationMenu').one("click", function(event) {
    openTranslationMenu();
    map.closePopup();
  });

});


//////TRANSCRIPTIONS
/*
$(document.activeElement).addEventListener("focus", function( event ) {
  event.target.style.background = "pink";  
  alert("the element going into focus is "+event.target.id);
}, true);

$("#transcriptionEditor").addEventListener("blur", function( event ) {
  alert("the element going to blur is "+event.target.id)
}, true);
*/
var openTranscriptionEditor = false;

//$( "#transcriptionEditor" ).on( "popupafteropen", function( event, ui ) {};

$( "#transcriptionEditor" ).on( "popupafterclose", function(event,ui) {
  //currently hardcoded for dev
  closeTranscriptionMenu("#transcriptionCarouselWrapper");
});

/////NEW LOCATIONS
$( "#popupTranscriptionNewMenu" ).on( "popupafteropen", function(event, ui) {
  openTranscriptionEditor = false;
    $('.openTranscriptionMenuNew').one("click", function(event) {
      insertSpanDivs();
      textSelectedParent = transcriptionURL.concat(startParentID);
      newTranscriptionFragment();
      textTypeSelected = "transcription";
      targetType = "transcription";
      openTranscriptionMenu();
      openTranscriptionEditor = true;
      $('#popupTranscriptionNewMenu').popup("close");    
    });
});
//because chaining popup links isn't explicitly supported in JQuery Mobile and while transcription editor is another JQM popup
$( "#popupTranscriptionNewMenu" ).on("popupafterclose", function(event, ui) {
  if (openTranscriptionEditor == true) {
    setTimeout( function(){ $( "#transcriptionEditor" ).popup( "open" ) }, 50 );
    openTranscriptionEditor = false;
  };
});

//////EXISTING LOCATIONS
$( "#popupTranscriptionChildrenMenu" ).on( "popupafteropen", function( event, ui ) {
  openTranscriptionEditor = false;
    $('.openTranscriptionMenuOld').one("click", function(event) {
      textSelected = startParentID;
      textSelectedID = startParentID;
      textSelectedFragment = $(outerElementTextIDstring).html();
      textSelectedFragmentString = $(outerElementTextIDstring).html().toString(); //remove html tags
      textSelectedParent = $(outerElementTextIDstring).parent().attr('id'); 
      textSelectedHash = textSelectedParent.concat(".body.text"+textSelectedID);
      textTypeSelected = "transcription";

      targetSelected = startParentID;
      targetType = "transcription";

      openTranscriptionMenu();
      openTranscriptionEditor = true;
      $('#popupTranscriptionChildrenMenu').popup("close");
    });
});
$( "#popupTranscriptionChildrenMenu" ).on("popupafterclose", function(event, ui) {
  if (openTranscriptionEditor == true) {
    setTimeout( function(){ $( "#transcriptionEditor" ).popup( "open" ) }, 50 );
    openTranscriptionEditor = false;
  };
});

$("#addNewBtn").click(function(){
  //add a check for which carousel is active and use that as selector but currently hardcoded for dev
    $("#transcriptionCarousel").carousel(0);
});

$('.addTranscriptionSubmit').one("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  addTranscription(targetSelected)
});

$('.votingUpButton').one("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  var votedID = event.target.siblings("blockquote").attr("id");
  var classString = event.target.className;
  var spanID = findClassID(classString, "spanID-");
  var parentID = findClassID(classString, "parentID-");
  var currentTopText = $(event.target).parent().parent().parent().siblings(".currentTop").find("blockquote").html();
  votingFunction("up", votedID, spanID[0], parentID[0], currentTopText);
  
});

$('.votingDownButton').one("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  var votedID = event.target.siblings("blockquote").attr("id");
  var classString = event.target.className;
  var spanID = findClassID(classString, "spanID-");
  var parentID = findClassID(classString, "parentID-");
  var currentTopText = $(event.target).parent().parent().parent().siblings(".currentTop").find("blockquote").html();
  votingFunction("up", votedID, spanID[0], parentID[0], currentTopText);
  
});


$('#transcriptionCarousel').on('slide.bs.carousel', function (event) {
  var slideID = event.relatedTarget.id;

  if (slideID == 1) {
    //display button to jump to slide 1
    alert("you can make a new one");
  }
  else {
    //display addTranscriptionSubmit button
  };

  ///change targetSelected according to slide viewed

})



/*
$( "#transcriptionEditor" ).position({
  my: "center",
  at: "center",
  of: "#ViewerBox1"
});
*/

/////TRANSLATIONS

$( "#transcriptionEditor" ).on( "popupafteropen", function( event, ui ) {});

$('.addTranslationSubmit').on("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  addTranslation(targetSelected)
});

/*
$( "#translationEditor" ).position({
  my: "center",
  at: "center",
  of: "#ViewerBox1"
});
*/



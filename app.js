var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer({ dest: 'uploads/'});
var fs = require('fs');
var xmldoc = require('xmldoc');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var status,contents,results,Pages,pages;
  
/** Permissible loading a single file, 
    the value of the attribute "name" in the form of "recfile". **/
var type = upload.single('uploads');

app.post('/uploads', type, function (req,res) {
    /** When using the "single"
      data come in "req.file" regardless of the attribute "name". **/
  var tmp_path = req.file.path;
 
  console.log(tmp_path);

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  var target_path = 'uploads/' + req.file.originalname;
  console.log(target_path);
  /** A better way to copy the uploaded file. **/
  var readable = fs.createReadStream(tmp_path);
  var writable = fs.createWriteStream(target_path);
  // All the data from readable goes into 'file.txt',
  // but only for the first second
  //readable.setEncoding('utf8');
  readable.pipe(writable , { end: false });
  readable.on('end', () => {
    writable.end();
    res.send('Completed');
  });
  
  setTimeout(() => {
    console.log('stop writing to '+ target_path);
    readable.unpipe(writable);
    console.log('manually close the file stream');
    writable.end();
  }, 1000);
  
  fs.readdir('uploads/', (err, data) => {
    if (!err) {
      for(i=0; i <= data.length; i++) {
        if (data[i] === 'data.xml') { 
            console.log(data[i]);
        }
      }
    }
  });

  /*
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  res.send('Completed');
  //src.on('end', function() { res.render('complete'); });
  //src.on('error', function(err) { res.render('error'); });
  */
});

app.use('/extract', function(req, res, next){
  
  var contents = fs.readFileSync(__dirname + "/uploads/data.xml","binary");
  if(fs.readFileSync(__dirname + "/uploads/data.xml")) {
  var results = new xmldoc.XmlDocument(contents);
  var pages = results.childNamed("Pages");
  //console.log(pages);
  var Pages = '{ "pages" : [';
  var jsonPages = '';
  var k = 1;
  var shapeID, shapeName, shapeValue;
    
    pages.eachChild(function (shapes) {
        var j = 0;
        var i = 1;
        console.log('Page ID: ' + shapes.attr.ID + ' Page Name: ' + shapes.attr.Name);
        Pages += '{pid:"'+ shapes.attr.ID + '", pname:"'+shapes.attr.Name + '", shapes: [';
        shapes.eachChild(function (shape) {
            
            shape.eachChild(function (s) {
                
                if (s.attr.ID != undefined) {
                    j++;
                    shapeID = s.attr.ID;
                    shapeName = s.attr.Name
                    shapeValue = (s.valueWithPath("Text") == undefined ? '' : s.valueWithPath("Text").replace(/\r?\n|\r/g,""))
                    
                    console.log(i++ 
                    + (s.attr.ID == undefined ? "" : ' ID: ' + s.attr.ID)
                    + (s.attr.Name == undefined ? "" : ' Name: ' + s.attr.Name)
                    + (s.valueWithPath("Text") == undefined ? '' : ' -> ' + s.valueWithPath("Text").replace(/\r?\n|\r/g,""))//+ (s.valueWithPath("Prop@ID") == undefined ? '' : ' -> ' + s.valueWithPath("Prop@ID"))+ (s.valueWithPath("Prop.Value") == undefined ? '' : ' -> ' + s.valueWithPath("Prop.Value"))+ (s.valueWithPath("Prop.Label") == undefined ? '' : ' -> ' + s.valueWithPath("Prop.Label"))
                    );
                    if (s.valueWithPath("Prop@ID")) {
                        s.eachChild(function (prop) {
                            (prop.attr.ID == undefined ? '' : 
                                console.log(
                                (prop.attr.ID == undefined ? '' : '   >> PropID: ' + prop.attr.ID + ' [ID:'+ s.attr.ID +'.'+ prop.attr.ID+']') 
                                + (prop.attr.Name == undefined ? '' : ' PropName: ' + prop.attr.Name)
                                + (prop.valueWithPath("Label") == undefined ? '' : ' PropLabel: ' + prop.valueWithPath("Label"))
                                + (prop.valueWithPath("Value") == undefined ? '' : ' PropValue: ' + prop.valueWithPath("Value").replace(/\r?\n|\r/g,""))
                                )
                            );
                        })
                    }
                    Pages += '{ "id":"'+shapeID+'" , "name":"'+shapeName+'" , "value":"'+shapeValue+'" }';
                    if (shape.childrenNamed('Shape').length == j ) {
                        Pages += '';
                    } else {
                        Pages += ',';    
                    }
                } 
            })
        }),
        //end shapes
        ((pages.childrenNamed('Page').length == k) ? Pages += ']} ]}' : Pages += ']}, ');
        
        console.log('---------------------------------------------------');
        console.log('Page ID: ' + shapes.attr.ID + ' : ' + shapes.attr.Name + ' [' + j + " Objects]" + k);
        console.log('---------------------------------------------------');
        
        k++;
    });
    var obj = JSON.stringify(eval("(" + Pages + ")"), null, 3);
    //var obj = JSON.stringify(Pages, null, 3);
    console.log('###########################');
    console.log(obj);
    res.setHeader('Content-Type', 'application/json');
    res.send(obj);
    //res.json(Pages); 
    
    next();
  }
}); 


var PORT = process.env.PORT || 3003;

app.listen(PORT, function () {
  console.log('Working on port ' + PORT);
});


function getXML(url) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
    req.send();
  });
}


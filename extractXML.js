var xmldoc = require('xmldoc');
var fs = require('fs');
//var results = new xmldoc.XmlDocument("data.xml");
    
var contents = fs
    .readFileSync(__dirname + "/data.xml","binary");

var results = new xmldoc.XmlDocument(contents);

var pages = results.childNamed("Pages");

//console.log(pages.valueWithPath("Page@ID"));
//console.log(pages.valueWithPath("Page@Name"));
//console.log(pages.valueWithPath("Page.Shapes.Shape@ID"));

var Pages = '{ "pages" : [';

var jsonPages = '';
var k = 1;
var shapeID, shapeName, shapeValue;

pages.eachChild(function (shapes) {
    var j = 0;
    var i = 1;
    console.log('Page ID: ' + shapes.attr.ID + ' Page Name: ' + shapes.attr.Name);
    Pages += '{"pid":"'+ shapes.attr.ID + '", "pname":"'+shapes.attr.Name + '", "shapes": [';
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
//var obj = JSON.parse(Pages);
var obj = JSON.stringify(eval("(" + Pages + ")"));
console.log('###########################');
console.log(obj);
// Script to import sample demandware xml file
// Command to execute : node sampleconverter.js <input xml file path> <output json file path>

var fs = require('fs'),
    xml2jsonConverter = require('./lib/xml2jsonconverter.js'),
    path = require('path');

var xmlFileDir = '';
var xmlFileName = '';
var jsonFileName = '';
var jsonFilePath = '';

if (process && process.argv && process.argv.length > 2) {
    var inputFilePath = path.parse(process.argv[2]);
    xmlFileDir = inputFilePath.dir;
    xmlFileName = path.join(xmlFileDir, inputFilePath.base);
    
    if (process.argv.length > 3) {
        jsonFilePath = process.argv[3];
    } else {
        jsonFileName = inputFilePath.name + ".json";
        jsonFilePath = path.join(xmlFileDir, jsonFileName);
    }
} else {
    console.log('XML File parameter is missing');
    process.exit(0);
}

var accountsObj = {};
accountsObj.accounts = [];

var converter = new xml2jsonConverter(xmlFileName, ["address", "custom-attribute"])

converter.convert(function(account) {
    // Custom Logic Placeholder
    account.data.customField = "customValue";

    accountsObj.accounts.push(account);
}, function() {
    fs.writeFile(jsonFilePath, JSON.stringify(accountsObj), function(err) {
        if (err) {
            console.log(err);
        }

        console.log("account data saved");
    });
});
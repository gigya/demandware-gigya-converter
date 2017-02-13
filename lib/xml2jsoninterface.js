// Version 4 - Used for JoAnn Import (library refactored)
// Command to execute 
// node convertxml2json.js <input xml file path> <output json file path>

var fs = require('fs'),
    xml2jsonConverter = require('./xml2jsonconverter.js'),
    path = require('path');

function xml2jsoninterface(inputFilePath, outputFilePath) {
    this.inputFile = inputFilePath;
    this.outputFile = outputFilePath;
    this.accountsObj = { "accounts": []};
}

xml2jsoninterface.prototype.convert = function(callback) {
    var self = this;
    var converter = new xml2jsonConverter(self.inputFile, ["address", "custom-attribute"])

    converter.convert(function(account) {
        if (callback) {
            // Custom Logic Placeholder
            callback(account);
        }

        self.accountsObj.accounts.push(account);
    }, function() {
        fs.writeFile(self.outputFile, JSON.stringify(self.accountsObj), function(err) {
            if (err) {
                console.log(err);
            }

            console.log("account data saved");
        });
    });
}

module.exports = xml2jsoninterface;
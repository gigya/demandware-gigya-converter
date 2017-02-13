var fs = require('fs'),
    XmlStream = require('xml-stream'); // https://github.com/assistunion/xml-stream

function xml2jsonconverter(filePath, attributesToCollect) {
    this.filePath = filePath;
    this.attributesToCollect = attributesToCollect;
}

xml2jsonconverter.prototype.convert = function(accountCallback, endCallback) {
    var self = this;
    console.log('conversion started');
    var stream = fs.createReadStream(this.filePath);
    var xml = new XmlStream(stream);

    for (i = 0; i < this.attributesToCollect.length; i++) {
        xml.collect(this.attributesToCollect[i]);
    }

    xml.on('endElement: customer', function(customer) {
        var account = {};
        self.buildProfileObject(customer, account);

        self.buildDataObject(customer, account);

        self.buildAccountObject(customer, account);

        accountCallback(account);
    });

    xml.on('end', function() {
        endCallback();
        console.log('conversion finished');
    });
}

xml2jsonconverter.prototype.buildProfileObject = function(customer, account) {
    account.profile = {};
    profile = account.profile;
    profileObj = customer.profile;

    profile.firstName = profileObj["first-name"];
    profile.lastName = profileObj["last-name"];
    profile.email = profileObj["email"];
    var gender = profileObj["gender"];

    if (gender) {
        profile.gender = gender === "1" ? "m" : "f";
    }

    this.buildPhoneObject(customer.profile, account);
}

xml2jsonconverter.prototype.buildAccountObject = function(customerObj, account) {
    account.UID = customerObj.$["customer-no"];

    account.username = customerObj.credentials.login;
    account.pwHashAlgorithm = customerObj.credentials.password.$.encryptionScheme;
    account.hashedPassword = customerObj.credentials.password.$text;

    this.buildPasswordObject(account);

    account.created = customerObj.profile["creation-date"];

    if (customerObj.profile["last-visit-time"]) {
        account.lastUpdated = customerObj.profile["last-visit-time"];
    }

    if (customerObj.profile["last-login-time"]) {
        account.lastLogin = customerObj.profile["last-login-time"];
    }

    // build loginIDs object
    if (account.profile.email || account.username) {
        this.buildloginIDs(account);
        //account.email = account.profile.email;
    }

    account.isVerified = true;
    account.isValid = true;
}

xml2jsonconverter.prototype.buildloginIDs = function(account) {
    account.loginIDs = {};

    if (account.profile.email) {
        account.loginIDs.emails = [];
        account.loginIDs.emails.push(account.profile.email);
    }

    // remove username field if username === email
    if (account.username === account.profile.email) {
        delete account.username;
    } else {
        account.loginIDs.username = [];
        account.loginIDs.username.push(account.username);

        delete account.username;
    }
}

xml2jsonconverter.prototype.buildPasswordObject = function(account) {
    // if (account.pwHashAlgorithm === "scrypt") {
    //     account.pwHashAlgorithm = "none";
    //     account.hashedPassword = "";
    // }

    account.password = {
        hash: account.hashedPassword,
        hashSettings: {
            algorithm: account.pwHashAlgorithm
        }
    };

    delete account.pwHashAlgorithm;
    delete account.hashedPassword;
}

xml2jsonconverter.prototype.buildPhoneObject = function(profileObj, account) {
    var phones = [];

    if (profileObj["phone-home"] && profileObj["phone-home"] != "") {
        var homePhone = {};
        homePhone.type = "phone_home";
        homePhone.number = profileObj["phone-home"];

        phones.push(homePhone);
    }

    if (profileObj["phone-business"] && profileObj["phone-business"] != "") {
        var businessPhone = {};
        businessPhone.type = "phone_business";
        businessPhone.number = profileObj["phone-business"];

        phones.push(businessPhone);
    }

    if (profileObj["phone-mobile"] && profileObj["phone-mobile"] != "") {
        var mobilePhone = {};
        mobilePhone.type = "phone_mobile";
        mobilePhone.number = profileObj["phone-mobile"];

        phones.push(mobilePhone);
    }

    if (phones.length > 0) {
        account.profile.phones = phones;
    }
}

xml2jsonconverter.prototype.buildDataObject = function(customer, account) {
    account.data = {};
    this.buildAddressesObject(customer.addresses, account.data);

    this.buildPreferenceObject(customer.profile, account.data);
}

xml2jsonconverter.prototype.buildAddressesObject = function(addressesObj, data) {
    if (addressesObj) {
        addressesObj = addressesObj.address;

        data.addresses = addressesObj.map(function(addressObj, index) {
            return {
                address_id: addressObj.$["address-id"],
                preferred: addressObj.$.preferred,
                firstName: addressObj["first-name"].length > 0 ? addressObj["first-name"] : "",
                lastName: addressObj["last-name"].length > 0 ? addressObj["last-name"] : "",
                address1: addressObj.address1.length > 0 ? addressObj.address1 : "",
                address2: addressObj.address2.length > 0 ? addressObj.address2 : "",
                city: addressObj.city.length > 0 ? addressObj.city : "",
                postal_code: addressObj["postal-code"].length > 0 ? addressObj["postal-code"] : "",
                state_code: addressObj["state-code"].length > 0 ? addressObj["state-code"] : "",
                country_code: addressObj["country-code"] && addressObj["country-code"].length > 0 ? addressObj["country-code"] : "",
                phone_number: addressObj.phone.length > 0 ? addressObj.phone : ""
            }
        });
    }
}

xml2jsonconverter.prototype.buildPreferenceObject = function(profileObj, data) {
    var self = this;
    if (profileObj["custom-attributes"]) {
        var customAttributes = profileObj["custom-attributes"]["custom-attribute"];

        customAttributes.map(function(customAttribute, index) {
            data[customAttribute["$"]["attribute-id"]] = self.getAttributeValue(customAttribute["$text"]);
        });
    }
}

xml2jsonconverter.prototype.getAttributeValue = function(val) {
    return val === "true" || val === "false" ? val === "true" ? true : false : val;
}

module.exports = xml2jsonconverter;
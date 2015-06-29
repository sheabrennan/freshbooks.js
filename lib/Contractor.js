var libxml = require('libxmljs');

/**
 * Creates a new Contractor.
 * 
 * @param {FreshBooks} FreshBooks
 * @return {Contractor}
 * @api public
 */
 
var Contractor = module.exports = function() {

};

/**
 * Constructs XML requests for the API depending on method.
 * 
 * @param {String} method
 * @param {Array} options (optional)
 * @param {Function} fn
 * @api private
 */
 
Contractor.prototype._setXML = function(method, fn) {
  var xml = new libxml.Document()
    , request = xml.node("request").attr("method", method)
    , options
    , self = this;
    
  //If second argument not a function then we have been passed the 'options' for contractor.list
  if("function" === typeof arguments[2]) {
    options = arguments[1];
    fn = arguments[2];
  }
  
  switch(method) {
    case "contractor.current":
    case "contractor.list":
    break;
    
    case "contractor.get":
      request.node("contractor_id").text(self.contractor_id);
    break;
  }

  fn(xml);
};

/**
 * Sets Contractor properties from results of XML request.
 * 
 * @param {Document} xml
 * @param {Function} fn
 * @api private
 */
 
Contractor.prototype._getXML = function(xml, fn) {
  var self = this
    , nodes = (xml.get("//xmlns:contractor", this.freshbooks.ns) || xml.get("//xmlns:contractors", this.freshbooks.ns)).childNodes();
  
  for(var x=0; x < nodes.length; x++) {
    if("text" !== nodes[x].name()) {
      switch(nodes[x].name()) {
        default:
          this[nodes[x].name()] = nodes[x].text();
        break;
      }
    }
  }
  fn();
};

/**
 * Gets Current Contractor Member
 * 
 * @param {Number} id
 * @param {Function} fn
 * @api public
 */
 
Contractor.prototype.current = function(fn) {
  var self = this;

  this._setXML("contractor.current", function(xml) {
    self.freshbooks._get(xml, function(err, xml) {
      if(null !== err) {
        fn(err);
      } else if("ok" !== xml.get("//xmlns:response",self.freshbooks.ns).attr("status").value()) {
        err = xml.get("//xmlns:error",self.freshbooks.ns).text();
        fn(new Error("CANNOT GET CURRENT CONTRACTOR: " + err));
      } else {
        self._getXML(xml, function() {
          fn(null, self);
        });
      }
    });
  });
};

/**
 * Gets a Contractor Member.
 * 
 * @param {Number} id (optional)
 * @param {Function} fn
 * @api public
 */
 
Contractor.prototype.get = function(fn) {
  var self = this;

  if("function" === typeof arguments[1]) {
    this.contractor_id = arguments[0];
    fn = arguments[1];
  }
  
  this._setXML("contractor.get", function(xml) {
    self.freshbooks._get(xml, function(err, xml) {
      if(null !== err) {
        fn(err);
      } else if("ok" !== xml.get("//xmlns:response",self.freshbooks.ns).attr("status").value()) {
        err = xml.get("//xmlns:error",self.freshbooks.ns).text();
        fn(new Error("CANNOT GET CONTRACTOR: " + err));
      } else {
        self._getXML(xml, function() {
          fn(null, self);
        });
      }
    });
  });
};

/**
 * List Contractor.
 * 
 * @param {Array} options (optional)
 * @param {Function} fn
 * @api public
 */
 
Contractor.prototype.list = function(fn) {
  var self = this
    , options = [];
  
  if("function" === typeof arguments[1]) {
    options = arguments[0];
    fn = arguments[1];
  }
  
  this._setXML("contractor.list", options, function(xml) {
    self.freshbooks._get(xml, function(err, xml) {
      if(null !== err) {
        fn(err);
      } else if("ok" !== xml.get("//xmlns:response",self.freshbooks.ns).attr("status").value()) {
        err = xml.get("//xmlns:error",self.freshbooks.ns).text();
        fn(new Error("CANNOT LIST CONTRACTOR: " + err));
      } else {
        var members = xml.get("//xmlns:contractors", self.freshbooks.ns)
          , options = { page: members.attr("page").value()
                      , per_page: members.attr("per_page").value()
                      , pages: members.attr("pages").value()
                      , total: members.attr("total").value() }
            members = [];
            
        xml.find("//xmlns:contractor", self.freshbooks.ns).forEach(function(a) {
          var member = new self.freshbooks.Contractor();
          xml = libxml.parseXmlString('<?xml version="1.0" encoding="UTF-8"?>' + '<response xmlns="http://www.freshbooks.com/api/" status="ok">' + a.toString() + '</response>');
          member._getXML(xml, function() {
            members.push(member);
          });
        });
        
        fn(null, members, options);
      }
    });
  });
};

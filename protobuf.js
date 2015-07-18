/**
 * This is the main wrapper for protobuf implementation
 **/

var assert   = require("assert")
  , Long     = require("long") ;
var protobuf = require("bindings")("protobuf.node") ;

function pb_wrapper() {
  if (!(this instanceof pb_wrapper)) {
    return new pb_wrapper.apply(this, arguments) ;
  }

  var descriptor = arguments[0] || null ;
  var int64      = arguments[1] || true ;

  assert(descriptor, "Descriptor must be provided") ;

  this.native = new protobuf.native(descriptor) ;
}

var parse_helper = function(obj) {
  if(!obj) {
    return obj;
  }
  for(var property in obj) {
    if(obj.hasOwnProperty(property)) {
      if(typeof obj[property] === 'object') {
        if(obj[property].hasOwnProperty('high') &&
           obj[property].hasOwnProperty('low') ) {
          obj[property] = new Long(obj[property].low, obj[property].high);
        } else {
          return parse_helper(obj[property]);
        }
      }
    }
  }
} ;

pb_wrapper.prototype.parse = function() {
  if (arguments.length < 2) {
    throw new Error("Invalid arguments")
  }

  var buffer   = arguments[0] ;
  var schema   = arguments[1] ;
  var callback = arguments[2] || null ;
  var native   = this.native ;

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("First argument must be a Buffer") ;
  }

  if (callback === null) {
    var result = native.parse(buffer, schema) ;
    parse_helper(result);
    if (result === null) {
      throw new Error("Unexpected error while parsing " + schema) ;
    } else {
      return result ;
    }
  }
  return process.nextTick(function() {
    try {
      var result = native.parse(buffer, schema) ;
      parse_helper(result);
      callback(null, result) ;
    } catch (e) {
      callback(e, null) ;
    }
  } ) ;
} ;

var serialize_helper = function(obj) {
  if(!obj) {
    return obj;
  }
  for(var property in obj) {
    if(obj.hasOwnProperty(property)) {
      if(typeof obj[property] === 'object') {
        if(Long.isLong( obj[property] ) ) {
          obj[property] = [ obj[property].getHighBitsUnsigned()
                          , obj[property].getLowBitsUnsigned() ] ;
        } else {
          return serialize_helper(obj[property]);
        }
      }
    }
  }
} ;

pb_wrapper.prototype.serialize = function() {
  if (arguments.length < 2) {
    throw new Error("Invalid arguments") ;
  }

  var object   = arguments[0] ;
  var schema   = arguments[1] ;
  var callback = arguments[2] || null ;
  var native   = this.native ;

  if (callback === null) {
    serialize_helper(object);
    var result = native.serialize(object, schema) ;
    if (result === null) {
      throw new Error("Missing required fields while serializing " + schema) ;
    } else {
      return result ;
    }
  }
  return process.nextTick(function() {
    try {
      serialize_helper(object);
      var result = native.serialize(object, schema) ;
      if (result === null) {
        return callback(Error("Missing required fields during serializing " + schema), null) ;
      } else {
        return callback(null, result) ;
      }
    } catch (e) {
      return callback(e, null) ;
    }
  } ) ;
} ;

pb_wrapper.prototype.info = function() {
  return this.native.info();
} ;

// backward compatibility
pb_wrapper.prototype.Parse     = pb_wrapper.prototype.parse ;
pb_wrapper.prototype.Serialize = pb_wrapper.prototype.serialize ;

module.exports = pb_wrapper ;

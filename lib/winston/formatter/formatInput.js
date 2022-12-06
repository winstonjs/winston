const { formatDefaultTransform } = require("./defaultTransform")
const { formatEcsTransform } = require("./ecsTransform")

function formatInput(info, formatTransformName){
    const func = {
      'ecsTransform': formatEcsTransform,
    }[formatTransformName] || formatDefaultTransform;

    return func(info);
}

module.exports = { formatInput };

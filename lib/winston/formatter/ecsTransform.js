const formatEcsTransform = (info) => {
  if (typeof info.service === 'string') {
    info.service = { name: info.service };
  }
  return info;
};

module.exports = { formatEcsTransform };


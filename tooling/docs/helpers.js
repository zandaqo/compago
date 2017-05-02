exports.escapedAnchor = function (anchor) {
  if (typeof anchor !== 'string') return null;
  return anchor.replace('+', '__').replace('.', '_');
};

exports.isMixinFunction = function() {
  return this.mixes && (this.kind === 'function');
};

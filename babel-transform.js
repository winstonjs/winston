module.exports = () => {
  return {
    visitor: {
      CallExpression(path) {
        if (!path.container.expression) return;

        const args = path.container.expression.arguments;
        if (args.length === 3 && args[0].loc && args[0].loc.identifierName === 'exports' && args[1].value === 'File') {
          path.remove();
        }
      }
    }
  };
};

const path = require('path');
const { rimraf } = require('rimraf');

function cleanTestArtifacts() {
  console.debug('\nCleaning test artifacts...');
  const testArtifacts = path.join(__dirname, 'fixtures', 'logs');
  rimraf.sync(path.join(testArtifacts, '*log*'), { glob: true });
}

module.exports = async () => {
  cleanTestArtifacts();
};

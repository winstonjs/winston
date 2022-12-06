const assume = require("assume");
const { formatInput } = require('../../../../lib/winston/formatter/formatInput');

describe('Format Info', function () {
	describe('formatEcsTransform', function () {
		it('should turn info.service from a string to an object', function() {
			const info = {
				level: 'info', 
				service: 'account'
			};

			const formattedInfo = formatInput(info, "ecsTransform");
			const expectedInfo = {
				level: 'info', 
				service: {name: 'account'}
			};

			assume(formattedInfo).deep.equals(expectedInfo);
		});
	});

	describe('defaultTransform', function () {
		it('should do nothing to the info', function() {
			const info = {
				level: 'info', 
				service: 'account'
			};

			const formattedInfo = formatInput(info, null);
			const expectedInfo = {
				level: 'info', 
				service: 'account'
			};

			assume(formattedInfo).deep.equals(expectedInfo);
		});
	});
});

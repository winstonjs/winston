# Fix Memory Leak in HTTP Transport

## Description
This PR fixes a memory leak issue in the HTTP transport that occurs when sending logs under high load. The issue was reported in #2465 and affects Winston 3.x.x versions.

### Problem
The HTTP transport had several memory leak sources:
- Callback handling could create unnecessary async operations
- Batch mode could accumulate requests without proper cleanup
- Event listeners weren't being properly managed

### Solution
- Improved callback handling to prevent async operation buildup
- Enhanced batch mode cleanup
- Added proper event listener management
- Optimized request handling

## Changes
- Improved HTTP transport's batch handling and cleanup
- Added proper callback returns
- Added comprehensive stress tests
- Added event listener cleanup verification

## Testing
Added new stress tests that:
1. Verify memory usage remains stable when sending many logs
2. Test batch mode behavior
3. Ensure event listeners are properly cleaned up

Test results show:
- Starting memory: ~6.5MB
- Peak memory: ~35MB
- Final memory after GC: ~22MB
- Successfully processes 100k messages with metadata
- Memory stays well under the 200MB limit

To run the tests:
```bash
# Run with garbage collection enabled for memory tests
node --expose-gc node_modules/mocha/bin/mocha test/unit/winston/transports/http*.test.js
```

## Related Issues
Fixes #2465

## Backwards Compatibility
These changes maintain full backwards compatibility as they only optimize internal operations without changing the transport's API or behavior.

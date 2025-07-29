# Fix Memory Leak in Console Transport

## Description
This PR fixes a memory leak issue in the Console transport that occurs when logging a large number of messages in quick succession. The issue was reported in #2548 and occurs in Winston 3.x.x versions.

### Problem
The Console transport was using `setImmediate` to emit the 'logged' event, which under high load (many log messages) would create a large number of pending operations that weren't being cleaned up properly. This led to increased memory usage over time.

### Solution
The fix removes the unnecessary `setImmediate` wrapper when emitting the 'logged' event. Since the console writes are already asynchronous (via stdout/stderr streams), there's no need for the additional async operation. This change significantly reduces memory usage under high load while maintaining the same functionality.

## Changes
- Removed `setImmediate` wrapper in Console transport's log method
- Added stress tests to catch memory leaks
- Verified event listener cleanup

## Testing
Added new stress tests that:
1. Verify memory usage remains stable when logging many messages
2. Ensure event listeners are properly cleaned up

To run the tests:
```bash
# Run with garbage collection enabled for memory tests
node --expose-gc node_modules/mocha/bin/mocha test/unit/winston/transports/console*.test.js
```

## Related Issues
Fixes #2548

## Backwards Compatibility
This change maintains full backwards compatibility as it only optimizes the internal event emission without changing the transport's API or behavior.

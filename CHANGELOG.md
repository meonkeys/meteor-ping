## 1.0.2 - 2016-10-27

* Fix bug: actually use `subscribeTimeout` instead of just `connectTimeout` for both `subscribe()` and `connect()` timeouts.

## 1.0.1 - 2016-09-09

* Prevent double callback bug in ddp `connect()`.

## 1.0.0 - 2016-09-07

* Improve timeout: use consistent [error-first callback](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/) behavior.
* Add `connectTimeout` and `subscribeTimeout` params on the command line and API.
* Drop support for Node.js < v4.x.x. `let`, `const`, and string templates ahoy!

## 0.2.3 - 2016-09-06

* Support arbitrary collection for `subscribe()` call.
* Upgrade ddp to latest (v0.12.0).

## 0.2.2 - 2016-07-28

* Refactor into a module and a library, and support use of either independently.

## 0.1.2 - 2016-03-17

* First release!

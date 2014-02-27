1) what was hard?
- design
- design testing
- implement miniHttp that would be similar t0 the original
- the whole HTTP pipelining and other hard stuff that were hard last exercise were OK now


2) what was fun?
- coffee overdose
- overall it was nice as the exercise progressed

3) if I was a hacker...
- infinite loop - will stuck on middleware (we wont process new requests)
.use('/hello/hacker', function (req,res,next) {
	var strike = true;
	while (strike) {
		// do nothing
	}
});

- infinite recursion - it will cause stack overflow and process will crash
.use('hello/hacker', function(req,res,next) {
	var rec = function() { 
		rec(); 
	};
	rec();
}


- we make sure it is called by:
a. putting this 'use' first (if we got the access)
b. resource /hello/hacker is quite unique, and chances are it isnt in file system
   so, all handlers will next() until ours.
c. connecting to the server using '<hostname>:<port>/hello/hacker'.

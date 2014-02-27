function bla() {}
bla.prototype = null;
A = new bla();

function B() {}
B.prototype = A;
b = new B();

function C() {}
C.prototype = B;
c = new C();

function D() {}
D.prototype = C;
d = new D();
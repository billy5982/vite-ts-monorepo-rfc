import { foo, bar } from '@test/lib'
import { foo as foo2 } from '@test/lib/foo'
import { bar as bar2 } from '@test/lib/bar'

foo()
foo2()
bar()
bar2()

type A  = number;
const a: A = 1;

export { a };
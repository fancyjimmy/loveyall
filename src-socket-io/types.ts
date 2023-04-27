export interface Class<T, A extends any[]> extends Function {
	new (...args: A): T;
}

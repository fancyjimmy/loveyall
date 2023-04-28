export type FormValueType = 'string' | 'number' | 'boolean';

export type NumberConstraint = {
	min?: number;
	max?: number;
	step?: number;
	float?: boolean;
};

export type StringConstraint = {
	minLength?: number;
	maxLength?: number;
	pattern?: string;
};

export type ValueOfFormType<T extends FormValueType> = T extends 'string'
	? string
	: T extends 'number'
	? number
	: boolean;

type BooleanConstraint = {
	[key: string]: never;
};

export type FormConstraint<T extends FormValueType> = {
	required?: boolean;
	default?: ValueOfFormType<T>;
	value: T extends 'string'
		? StringConstraint
		: T extends 'number'
		? NumberConstraint
		: BooleanConstraint;
};

export type FormValue<T extends FormValueType> = {
	constraints: FormConstraint<T>;
	type: T;
	name: string;
};

let b: FormValue<'boolean'> = {
	constraints: {
		default: false,
		value: {}
	},
	name: 'test',
	type: 'boolean'
};

export type FormType = FormValue<any>[];

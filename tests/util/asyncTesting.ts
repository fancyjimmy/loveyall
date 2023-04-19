import {beforeEach, test, type TestContext, type TestOptions} from "vitest";

export async function asyncBeforeEach(fn: (done: () => void, context: TestContext) => void): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {

        console.log("asyncBeforeAll");
        beforeEach(async (context) => {
            fn(() => {
                resolve();
            }, context);
            await promise;
        });
    });

    return promise;
}


export async function asyncTest(name: string, fn: (done: () => void, context: TestContext) => void, options?: number | TestOptions): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
        test(name, async (context) => {
            fn(() => {
                resolve();
            }, context);
            await promise;
        }, options);
    });

    return promise;
}
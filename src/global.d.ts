/* eslint-disable @typescript-eslint/no-explicit-any */
export { };

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'a-scene': any;
            'a-entity': any;
            'a-camera': any;
            [elemName: string]: any;
        }
    }
}

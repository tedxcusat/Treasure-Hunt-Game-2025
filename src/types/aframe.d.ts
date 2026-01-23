/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace JSX {
    interface IntrinsicElements {
        'a-scene': any;
        'a-entity': any;
        'a-camera': any;
        [elemName: string]: any;
    }
}

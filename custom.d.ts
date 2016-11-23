
declare module 'react-google-maps' {
    export const withGoogleMap: any;
    export const GoogleMap: any;
    export const Marker: any;
    export const InfoWindow: any;
}

declare module 'react-google-maps/lib/drawing/DrawingManager' {
    export const DrawingManager: any;
    export default DrawingManager;
}

declare module 'react-modal-bootstrap' {
  export const Modal : any;
  export const ModalHeader : any;
  export const ModalTitle : any;
  export const ModalClose : any;
  export const ModalBody : any;
  export const ModalFooter : any;
}

declare module 'react-input-range' {
  export = ReactInputRange.InputRange;
}

declare namespace ReactInputRange {
    import __React = React;
    interface IRange {
        min: number;
        max: number;
    }

    interface IInputRangeProps {
        classNames?: {
            component?: string;
            labelContainer?: string;
            labelMax?: string;
            labelMin?: string;
            labelValue?: string;
            slider?: string;
            sliderContainer?: string;
            trackActive?: string;
            trackContainer?: string;
        };

        ariaLabelledby?: string;
        ariaControls?: string;
        defaultValue?: number;
        disabled?: boolean;
        formatLabel?:
            (labelValue: string, preSuffix: { labelPrefix: string, labelSuffix: string}) => string;

        labelPrefix?: string;
        labelSuffix?: string;
        maxValue?: number;
        minValue?: number;
        name?: string;
        onChange: (element: this, value: (number | IRange)) => any;
        onChangeComplete?: () => any;
        step?: number;
        value: number | IRange;
    }

    export class InputRange extends __React.Component<IInputRangeProps, any> {}
}

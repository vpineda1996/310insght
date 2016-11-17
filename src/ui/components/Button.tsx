import * as React from "react";

export interface ButtonProps { text?: string; active?: boolean; onClick?: Function; cssClass?: string}

export class Button extends React.Component<ButtonProps, {}> {
    static defaultProps : ButtonProps  = {
        text: "",
        active: false,
        onClick: () => {},
        cssClass: ""
    }

    render() {
        return <a className={this.props.active ? "active " + this.props.cssClass : this.props.cssClass} onClick={this.props.onClick.bind(this)}>
                        {this.props.text}
               </a>;
    }
}
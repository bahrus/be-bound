import {BeDecoratedProps} from 'be-decorated/types';

export interface BeBoundVirtualProps{
    propBindings: BindingPair[];

}

export interface BeBoundProps extends BeBoundVirtualProps{
    proxy: Element & BeBoundVirtualProps;
}

export interface BeBoundActions {
    onProps(self: this): void;
}

export type BindingPair = [childProp: string, hostProp: string, options?: BindingOptions];

export interface BindingOptions{
    localValueTrumps: boolean;
    noClone: boolean;
}

export type HostSubscriptionMap = {[key: string]: HostSubscriptionStatus}

export interface HostSubscriptionStatus {
    inProgress: boolean,
}
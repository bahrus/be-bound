import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';

export interface EndUserProps<TChild = any, THost = any> {
    propBindings?: BindingPair<TChild, THost>[];
}
export interface VirtualProps extends EndUserProps, MinimalProxy{
   
}

export type Proxy = Element & VirtualProps;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;

export interface Actions {
    onProps(pp: PP): void;
}

export type BindingPair<TChild = any, THost = any> = [childProp: keyof Partial<TChild> & string, hostProp: keyof Partial<THost> & string, options?: BindingOptions];

export interface BindingOptions{
    localValueTrumps: boolean;
    noClone: boolean;
}

export type HostSubscriptionMap = {[key: string]: HostSubscriptionStatus}

export interface HostSubscriptionStatus {
    inProgress: boolean,
}
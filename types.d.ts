import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';
import {Target} from 'trans-render/lib/types';

export interface EndUserProps<TChild = any, THost = any> extends IBE {
    propBindings?: BindingTupletOrString<TChild, THost>[] | BindingTupletOrString<TChild, THost>;
    Between?: Array<BetweenStatement>;
}

export interface AllProps extends EndUserProps {}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>]

export type BetweenStatement = string;


export interface Actions {
    onProps(self: this): ProPAP;
}

export type BindingTuplet<TChild = any, THost = any> =  [childProp: keyof Partial<TChild> & string, hostProp: keyof Partial<THost> & string, options?: BindingOptions]

export type BindingTupletOrString<TChild = any, THost = any> = BindingTuplet<TChild, THost> | keyof THost;

export interface BindingOptions{
    localValueTrumps: boolean;
    noClone: boolean;
}

export interface BoundRemoteTarget {
    TargetRelativeToAdornedElement: Target
}

export type HostSubscriptionMap = {[key: string]: HostSubscriptionStatus}

export interface HostSubscriptionStatus {
    inProgress: boolean,
}
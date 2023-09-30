import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';
import {ElTypes, SignalRefType} from 'be-linked/types';

export interface EndUserProps extends IBE{
    To?: Array<ToStatement>,
}

export interface AllProps extends EndUserProps{
    bindingRules?: Array<BindingRule>,
}

export type SignalEnhancement = 'be-value-added' | 'be-propagating' | undefined;

export interface BindingRule {
    localProp?: string,
    remoteProp?: string,
    remoteAttr?: string,
    remoteType?: ElTypes,
    localSignal?: WeakRef<SignalRefType>,
    remoteSignal?: WeakRef<SignalRefType>,
    //remoteEnhancement?: SignalEnhancement,
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>];

export interface Actions{
}

export type ToStatement = string;

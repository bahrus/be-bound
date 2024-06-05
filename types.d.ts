import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';
import {ElTypes, SignalRefType, SignalContainer} from 'be-linked/types';
import { Specifier } from "trans-render/dss/types";

export interface EndUserProps extends IBE{
    With?: Array<WithStatement>,
    Between?: Array<BetweenStatement>,
    with?: Array<WithStatement>,
    between?: Array<BetweenStatement>,
}

export interface AllProps extends EndUserProps{
    bindingRules?: Array<BindingRule>,
    //partialBindingRules?: Array<BindingRule>,
    isParsed?: boolean,
    //parsedWith?: boolean,
    //parsedBetween?: boolean,
    rawStatements?: Array<string>
}

export type SignalEnhancement = 'be-value-added' | 'be-propagating' | undefined;

export interface BindingRule {
    localProp?: string,
    localEvent?: string,
    remoteSpecifierString?: string,
    remoteSpecifier?: Specifier
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>];

export interface Actions{
    noAttrs(self: this): ProPAP;
    //onCamelized(self: this): ProPAP;
    hydrate(self: this): ProPAP;
    onRawStatements(self: this): void;
}

export type WithStatement = string;

export type BetweenStatement = string;

export type TriggerSource = 'local' | 'remote' | 'tie';

export interface SpecificityResult {
    val?: any,
    winner?: TriggerSource;
}

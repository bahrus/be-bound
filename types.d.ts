import {BeDecoratedProps} from 'be-decorated/types';

export interface BeBoundVirtualProps{
    props: BindingPair[];

}

export interface BeBoundProps extends BeBoundVirtualProps{
    proxy: Element & BeBoundVirtualProps;
}

export interface BeBoundActions {
    
}

export type BindingPair = [childProp: string, hostProp: string, options?: BindingOptions];

export interface BindingOptions{
    localValueTrumps: boolean;
    noClone: boolean;
}
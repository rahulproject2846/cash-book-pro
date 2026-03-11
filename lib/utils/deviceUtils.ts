/**
 * 🔧 DEVICE PERFORMANCE UTILITY - Vault Pro V18.0
 * 🎯 লক্ষ্য: ৪ সেকেন্ডের "Oil Pouring" টেস্ট ডিউরেশন।
 */

export type DevicePerformanceTier = 'high' | 'medium' | 'low';

export const getDevicePerformance = (): DevicePerformanceTier => {
    if (typeof window === 'undefined') return 'high';
    const cores = navigator.hardwareConcurrency || 2;
    return cores > 4 ? 'high' : 'medium';
};

export const getAnimationDuration = (tier: DevicePerformanceTier): number => {
    if (tier === 'low') return 1000;
    return 4000; // 🕒 ৪ সেকেন্ড
};

/**
 * 🌊 VISCOUS LIQUID EASING
 * এটি একটি "ভারি এবং ঘন" তেলের মতো গতি তৈরি করে।
 */
export const getAnimationEasing = () => {
    return [0.8, 0, 0.1, 1]; // "Heavy Viscosity" S-Curve
};

export const supportsViewTransition = (): boolean => false;

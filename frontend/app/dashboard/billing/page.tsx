'use client';

import { useState, useEffect } from 'react';
import { billingApi, creditsApi, paymentsApi, type SubscriptionPlan, type BillingHistory } from '@/src/lib/api';
import { useAuth } from '@/src/context/auth-context';
import {
    CreditCard,
    Zap,
    Check,
    Crown,
    ArrowRight,
    Download,
    Clock,
    Package,
    Sparkles,
    ChevronRight,
    Loader2,
    AlertCircle,
    Gift,
    History,
    X,
    FileText,
    CreditCard as CardIcon,
    RefreshCw,
    Plus,
    Trash,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { toast } from '../../../src/hooks/use-toast';
import { Switch } from '@/src/components/ui/switch';
import type { PaymentMethod } from '@/src/lib/types';

interface BillingData {
    credits: number;
    bonusCredits: number;
    subscription: {
        plan: SubscriptionPlan;
        status: string;
        expires_at: string;
        auto_renew?: boolean;
    } | null;
    plans: SubscriptionPlan[];
    payments: BillingHistory[];
    paymentMethods: PaymentMethod[];
}

const CREDIT_PACKS = [
    { id: 'pack_100', credits: 100, price: 9.99, popular: false },
    { id: 'pack_500', credits: 500, price: 39.99, popular: true, savings: '20%' },
    { id: 'pack_1000', credits: 1000, price: 69.99, popular: false, savings: '30%' },
    { id: 'pack_5000', credits: 5000, price: 299.99, popular: false, savings: '40%' },
];

export default function BillingPage() {
    const { user } = useAuth();
    const [billingData, setBillingData] = useState<BillingData>({
        credits: 0,
        bonusCredits: 0,
        subscription: null,
        plans: [],
        payments: [],
        paymentMethods: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [processingCredits, setProcessingCredits] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            const [creditsData, subscriptionData, plansData, paymentsData, methodsData] = await Promise.allSettled([
                creditsApi.getBalance(),
                billingApi.getCurrentSubscription(),
                billingApi.getPlans(),
                billingApi.getHistory(),
                paymentsApi.getPaymentMethods(),
            ]);

            setBillingData({
                credits: creditsData.status === 'fulfilled' ? creditsData.value.credits : user?.credits || 0,
                bonusCredits: creditsData.status === 'fulfilled' ? creditsData.value.bonus_credits : 0,
                subscription: subscriptionData.status === 'fulfilled' ? subscriptionData.value : null,
                plans: plansData.status === 'fulfilled' ? plansData.value : [],
                payments: paymentsData.status === 'fulfilled' ? paymentsData.value : [],
                paymentMethods: methodsData.status === 'fulfilled' ? methodsData.value : [],
            });
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        setProcessingPlan(planId);
        try {
            const { checkout_url } = await billingApi.subscribe(planId);
            window.location.href = checkout_url;
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast({
                title: 'Subscription Failed',
                description: 'Unable to process subscription. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setProcessingPlan(null);
        }
    };

    const handlePurchaseCredits = async (packId: string, credits: number) => {
        setProcessingCredits(packId);
        try {
            const { checkout_url } = await creditsApi.purchase(packId);
            window.location.href = checkout_url;
        } catch (error) {
            console.error('Failed to purchase credits:', error);
            toast({
                title: 'Purchase Failed',
                description: 'Unable to process credit purchase. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setProcessingCredits(null);
        }
    };

    const handleRedeemCode = async () => {
        if (!redeemCode.trim()) return;

        setIsRedeeming(true);
        try {
            const result = await creditsApi.redeem(redeemCode);
            toast({
                title: 'Code Redeemed!',
                description: `You received ${result.credits} credits!`,
            });
            setRedeemCode('');
            fetchBillingData();
        } catch (error) {
            console.error('Failed to redeem code:', error);
            toast({
                title: 'Invalid Code',
                description: 'The code you entered is invalid or has expired.',
                variant: 'destructive',
            });
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;

        try {
            await billingApi.cancelSubscription();
            toast({ title: 'Subscription cancelled', description: 'Your subscription will end at the current billing period.' });
            fetchBillingData();
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
        }
    };

    const handleDownloadInvoice = async (transactionId: string) => {
        try {
            const { invoice_url } = await paymentsApi.generateInvoice(transactionId);
            window.open(invoice_url, '_blank');
        } catch (error) {
            console.error('Failed to download invoice:', error);
            toast({
                title: 'Download Failed',
                description: 'Unable to download invoice. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleToggleAutoRenew = async () => {
        if (!billingData.subscription) return;

        const newStatus = !billingData.subscription.auto_renew;
        // Optimistic update
        setBillingData(prev => ({
            ...prev,
            subscription: prev.subscription ? { ...prev.subscription, auto_renew: newStatus } : null
        }));

        try {
            await billingApi.toggleAutoRenew();
            toast({
                title: newStatus ? 'Auto-renew enabled' : 'Auto-renew disabled',
                description: `Your subscription will ${newStatus ? 'renew automatically' : 'not renew'} at the end of the billing period.`
            });
        } catch (error) {
            console.error('Failed to toggle auto-renew:', error);
            // Revert on error
            setBillingData(prev => ({
                ...prev,
                subscription: prev.subscription ? { ...prev.subscription, auto_renew: !newStatus } : null
            }));
            toast({
                title: 'Update Failed',
                description: 'Unable to update subscription settings.',
                variant: 'destructive',
            });
        }
    };

    const handleDeletePaymentMethod = async (methodId: string) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return;

        try {
            await paymentsApi.deletePaymentMethod(methodId);
            setBillingData(prev => ({
                ...prev,
                paymentMethods: prev.paymentMethods.filter(pm => pm.id !== methodId)
            }));
            toast({ title: 'Payment method removed' });
        } catch (error) {
            console.error('Failed to remove payment method:', error);
            toast({
                title: 'Action Failed',
                description: 'Unable to remove payment method.',
                variant: 'destructive',
            });
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0f7d70]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Billing & Credits</h1>
                    <p className="text-gray-600 mt-1">Manage your subscription and purchase credits</p>
                </div>

                {/* Credits Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Current Credits */}
                    <div className="bg-gradient-to-br from-[#0f7d70] to-[#0a5a52] rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Zap className="w-6 h-6" />
                            </div>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-white/80 hover:text-white text-sm flex items-center gap-1"
                            >
                                <History className="w-4 h-4" />
                                History
                            </button>
                        </div>
                        <p className="text-white/80 text-sm mb-1">Available Credits</p>
                        <p className="text-5xl font-bold mb-2">{billingData.credits.toLocaleString()}</p>
                        {billingData.bonusCredits > 0 && (
                            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-2">
                                <Gift className="w-4 h-4" />
                                <span className="text-sm">+{billingData.bonusCredits} bonus credits</span>
                            </div>
                        )}
                    </div>

                    {/* Current Subscription */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Crown className="w-6 h-6 text-purple-600" />
                            </div>
                            {billingData.subscription && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${billingData.subscription.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {billingData.subscription.status}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mb-1">Current Plan</p>
                        <p className="text-2xl font-bold text-gray-900 mb-2">
                            {billingData.subscription?.plan.name || 'Free'}
                        </p>
                        {billingData.subscription ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {billingData.subscription.auto_renew ? 'Renews' : 'Expires'} {formatDate(billingData.subscription.expires_at)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">Auto-renew</span>
                                    <Switch
                                        checked={billingData.subscription.auto_renew}
                                        onCheckedChange={handleToggleAutoRenew}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Upgrade for more features</p>
                        )}
                    </div>
                </div>

                {/* Redeem Code */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Gift className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Redeem Code</h2>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter your code..."
                            value={redeemCode}
                            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f7d70]/20 focus:border-[#0f7d70] uppercase"
                        />
                        <Button
                            onClick={handleRedeemCode}
                            disabled={isRedeeming || !redeemCode.trim()}
                            className="bg-[#0f7d70] hover:bg-[#0c6a61] text-white"
                        >
                            {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                        </Button>
                    </div>
                </div>

                {/* Subscription Plans */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {billingData.plans.map((plan) => {
                            const isCurrentPlan = billingData.subscription?.plan.name === plan.name;
                            const isPopular = plan.name === 'Pro';

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${isPopular
                                        ? 'border-[#0f7d70] shadow-lg shadow-[#0f7d70]/10'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className="bg-[#0f7d70] text-white text-xs font-medium px-3 py-1 rounded-full">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold text-gray-900">${plan.price_monthly}</span>
                                            <span className="text-gray-500">/month</span>
                                        </div>
                                        <p className="text-sm text-[#0f7d70] font-medium mt-2">
                                            {plan.credits_per_month.toLocaleString()} credits/month
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-[#0f7d70] flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full ${isCurrentPlan
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : isPopular
                                                ? 'bg-[#0f7d70] hover:bg-[#0c6a61] text-white shadow-lg shadow-[#0f7d70]/20'
                                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                                            }`}
                                        disabled={isCurrentPlan || processingPlan === plan.id}
                                        onClick={() => handleSubscribe(plan.id)}
                                    >
                                        {processingPlan === plan.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isCurrentPlan ? (
                                            'Current Plan'
                                        ) : (
                                            <>
                                                Upgrade <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Credit Packs */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy Credits</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {CREDIT_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`relative bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${pack.popular
                                    ? 'border-[#0f7d70] shadow-lg'
                                    : 'border-gray-100 hover:border-[#0f7d70]'
                                    }`}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-2.5 right-4">
                                        <span className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                                            Best Value
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-[#0f7d70]/10 rounded-lg">
                                        <Package className="w-5 h-5 text-[#0f7d70]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{pack.credits.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">credits</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">${pack.price}</span>
                                        {pack.savings && (
                                            <span className="ml-2 text-xs text-green-600 font-medium">Save {pack.savings}</span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4 bg-[#0f7d70] hover:bg-[#0c6a61] text-white"
                                    disabled={processingCredits === pack.id}
                                    onClick={() => handlePurchaseCredits(pack.id, pack.credits)}
                                >
                                    {processingCredits === pack.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Buy Now'
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div id="payment-methods" className="mb-8 scroll-mt-20">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {billingData.paymentMethods.map((method) => (
                            <div key={method.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        <CardIcon className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {method.type} •••• {method.last4}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Expires {method.expiry}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePaymentMethod(method.id)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <button className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0f7d70] hover:bg-gray-50 transition-colors group">
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#0f7d70]" />
                            <span className="font-medium text-gray-600 group-hover:text-[#0f7d70]">Add Payment Method</span>
                        </button>
                    </div>
                </div>

                {/* Payment History */}
                {showHistory && billingData.payments.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-1 hover:bg-gray-100 rounded-md"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {billingData.payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {formatDate(payment.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{payment.description}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">${payment.amount}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : payment.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(payment.id)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <FileText className="w-4 h-4 text-gray-500" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Manage Subscription */}
                {billingData.subscription && (
                    <div className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600">Need to make changes to your subscription?</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href="#payment-methods"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('payment-methods')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-[#0f7d70] hover:underline text-sm font-medium"
                                >
                                    Manage Payment Method
                                </a>
                                <button
                                    onClick={handleCancelSubscription}
                                    className="text-red-600 hover:underline text-sm font-medium"
                                >
                                    Cancel Subscription
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

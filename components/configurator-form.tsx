import ConfiguratorFormClient from './configurator-form-client';
import { serializePricing, type Pricing } from '@/lib/pricing';

type Props = {
  pricing: Pricing;
};

export default function ConfiguratorForm({ pricing }: Props) {
  return <ConfiguratorFormClient pricing={serializePricing(pricing)} />;
}

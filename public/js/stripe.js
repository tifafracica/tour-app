import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  var stripe = Stripe("pk_test_51IeM72IOHPNKHCPQre2jIp2SYmQEsI9xYR7RmSFTsm8byZa1btb5WqwjUnXNJobghuHA2mdDEbuM65BpkgF4ppy100mUmrKHxk");
  try {
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session)
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
}
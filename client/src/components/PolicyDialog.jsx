import Dialog from './Dialog';
import Icon from './Icon';
import { useApp } from '../context/AppContext';

const SAFETY_POLICY = {
  title: 'Our safety commitment',
  html: `
    <h3>Before every trip</h3>
    <ul>
      <li>We check weather forecasts, rainfall and water levels.</li>
      <li>We inspect harnesses, helmets, ropes and wetsuits.</li>
      <li>We brief every guest on what to expect and how to move safely.</li>
      <li>We ask about medical conditions, swimming ability and experience.</li>
    </ul>
    <h3>In the canyon</h3>
    <ul>
      <li>Your guide sets the pace and makes the final call on jumps and slides.</li>
      <li>Optional obstacles can be bypassed; you never have to do a jump you are not comfortable with.</li>
      <li>Guides carry communication and emergency equipment.</li>
      <li>We keep group sizes small so every guest gets attention.</li>
    </ul>
    <h3>Weather & water levels</h3>
    <p>If conditions are unsafe, we reroute, reschedule or cancel the trip. This decision is made by the guide and is not negotiable. Your safety is more important than completing the route.</p>
    <h3>Insurance & emergency</h3>
    <p>Travel insurance is recommended. We maintain an emergency action plan and local rescue contacts. Tell your guide immediately if you feel unwell, injured or unsure.</p>`,
};

export default function PolicyDialog() {
  const { policyKey, closePolicy, content } = useApp();
  const policy = policyKey === 'safety' ? SAFETY_POLICY : content.policies?.[policyKey];
  const open = Boolean(policyKey && policy);

  return (
    <Dialog open={open} onClose={closePolicy} className="policy-dialog" labelledBy="policyTitle">
      <div className="dialog-card">
        <button className="dialog-close" type="button" onClick={closePolicy} aria-label="Close policy"><Icon name="close" /></button>
        <div className="dialog-head">
          <span className="kicker">Good to know</span>
          <h2 id="policyTitle">{policy?.title || 'Policy'}</h2>
        </div>
        <div className="policy-body" id="policyBody" dangerouslySetInnerHTML={{ __html: policy?.html || '' }} />
        <div className="policy-updated">Last updated: November 2026 · Questions? Email hello@canyoningbali.com</div>
      </div>
    </Dialog>
  );
}
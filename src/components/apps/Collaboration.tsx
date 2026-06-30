import { userConfig } from '../../config/index';
import { useOSStore } from '../../stores/osStore';

export default function Collaboration() {
  const setMeetingBooked = useOSStore((s) => s.setMeetingBooked);
  const meetingBooked = useOSStore((s) => s.meetingBooked);
  const calendlyUrl = userConfig.contact.calendly;
  // Use Calendly's native (light) theme so form labels and typed input text stay
  // legible. Forcing a dark background made the white input text invisible, and
  // the iframe is cross-origin so its fields can't be styled from here.
  const embedUrl = calendlyUrl
    ? `${calendlyUrl}${calendlyUrl.includes('?') ? '&' : '?'}hide_gdpr_banner=1&primary_color=2563eb`
    : '';

  return (
    <div className="h-full overflow-y-auto no-scrollbar text-gray-200 p-6">
      <h1 className="text-2xl font-bold mb-2">Book a Meeting</h1>
      <p className="text-gray-400 text-sm mb-4">Schedule time to discuss opportunities, collaborations, or projects.</p>

      {meetingBooked ? (
        <div className="p-6 rounded-xl bg-green-900/20 border border-green-500/30 space-y-4">
          <h2 className="text-lg font-semibold text-green-400">Meeting scheduled!</h2>
          <p className="text-sm text-gray-400">Your desktop is now in collaboration mode.</p>
          <div className="text-3xl font-mono font-bold" id="meeting-countdown">--:--:--</div>
          <ul className="text-sm space-y-2 text-gray-400">
            <li>☐ Review resume & projects</li>
            <li>☐ Prepare questions about Tokenistt</li>
            <li>☐ Check TalkwithDB demo</li>
          </ul>
          <button
            onClick={() => setMeetingBooked(false)}
            className="text-xs text-blue-400 underline"
          >
            Book another time
          </button>
        </div>
      ) : calendlyUrl ? (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-white">
            <iframe
              src={embedUrl}
              title="Schedule a call via Calendly"
              className="w-full h-[70vh] min-h-[380px] md:min-h-[520px]"
              style={{ border: 'none' }}
              loading="lazy"
            />
          </div>
          <p className="text-xs text-gray-500">
            Trouble with the embed?{' '}
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMeetingBooked(true)}
              className="text-blue-400 underline"
            >
              Open Calendly in a new tab
            </a>
            . Or email {userConfig.contact.email}
          </p>
        </div>
      ) : (
        <>
          <a
            href={userConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 rounded-xl font-medium hover:bg-blue-500"
          >
            Connect on LinkedIn
          </a>
          <p className="text-xs text-gray-500 mt-4">Or email {userConfig.contact.email}</p>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Calendar, Clock, MapPin, Plus, Trash2, CalendarDays } from "lucide-react";

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventTime: "",
    eventType: "University Announcement",
    organizedBy: "",
    bannerImage: "",
    registrationLink: "",
    websiteLink: "",
    moreDetailsLink: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Re-using the public endpoint is fine, since Admin needs to see all events
      const res = await api.get<any[]>("/events");
      setEvents(res.data || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/events", formData);
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        eventDate: "",
        eventTime: "",
        eventType: "University Announcement",
        organizedBy: "",
        bannerImage: "",
        registrationLink: "",
        websiteLink: "",
        moreDetailsLink: "",
      });
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/admin/events/${id}`);
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">University Events</h2>
          <p className="text-muted-foreground">Manage and broadcast updates to students.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="h-5 w-5" /> Create Event
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center flex flex-col items-center">
          <CalendarDays className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Active Events</h3>
          <p className="text-muted-foreground mb-6">
            Create an event to notify students on their dashboard.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow"
          >
            Create First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="glass rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all hover:shadow-glow"
            >
              {event.bannerImage && (
                <div className="h-32 w-full bg-muted">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md inline-block">
                    {event.eventType}
                  </span>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="font-bold text-lg mb-2 leading-tight">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{event.eventTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.organizedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass bg-card rounded-3xl p-6 w-full max-w-lg shadow-xl relative">
            <h3 className="text-xl font-bold font-display mb-4">Create New Event</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                  Event Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  placeholder="e.g. Hackathon 2026"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 p-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary resize-none"
                  placeholder="Brief description of the event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Time
                  </label>
                  <input
                    required
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Event Type
                  </label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  >
                    <option>University Announcement</option>
                    <option>Hackathon</option>
                    <option>Workshop</option>
                    <option>Seminar</option>
                    <option>Placement Drive</option>
                    <option>Exam Notice</option>
                    <option>Cultural Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Organized By
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.organizedBy}
                    onChange={(e) => setFormData({ ...formData, organizedBy: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    placeholder="e.g. Innovation Cell"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Registration Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.registrationLink}
                    onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary text-xs"
                    placeholder="e.g. Google Form"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.websiteLink}
                    onChange={(e) => setFormData({ ...formData, websiteLink: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary text-xs"
                    placeholder="https://hackathon.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    More Details (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.moreDetailsLink}
                    onChange={(e) => setFormData({ ...formData, moreDetailsLink: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary text-xs"
                    placeholder="e.g. Notion Page"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

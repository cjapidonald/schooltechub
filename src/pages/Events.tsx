import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Clock, MapPin, Users, Video, Award, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { format, differenceInMilliseconds } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";
import { cn } from "@/lib/utils";

const Events = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventMode: searchParams.getAll("eventMode") || [],
    eventPriceType: searchParams.getAll("eventPriceType") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || []
  });

  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "Workshop", label: "Workshops" },
    { value: "Webinar", label: "Webinars" },
    { value: "Meetup", label: "Meetups" },
    { value: "upcoming", label: "Upcoming Events" },
    { value: "past", label: "Past Events & Recordings" }
  ];

  const filterOptions = {
    eventMode: ["Online", "In-person", "Hybrid", "Live"],
    eventPriceType: ["Free", "Paid"],
    stage: ["Early Childhood", "Pre-K", "Kindergarten", "Lower Primary", "Upper Primary", "Primary", "Secondary", "High School", "K-12", "K-5"],
    subject: ["Phonics", "Reading", "Writing", "Grammar", "Spelling", "Vocabulary", "English/ELA", "Math", "Science", "Biology", "Chemistry", "Physics", "Earth Science", "ICT", "STEM", "STEAM"]
  };

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedType, filters]);

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      setEvents(prev => [...prev]); // Force re-render
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("*")
        .eq("is_published", true);

      if (selectedType === "upcoming") {
        query = query.gte("start_datetime", new Date().toISOString());
      } else if (selectedType === "past") {
        query = query.lt("start_datetime", new Date().toISOString());
      } else if (selectedType !== "all") {
        query = query.eq("event_type", selectedType as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.eventMode.length > 0) {
        query = query.in("event_mode", filters.eventMode as any);
      }

      if (filters.eventPriceType.length > 0) {
        query = query.in("event_price_type", filters.eventPriceType as any);
      }

      // Note: stage and subject filters removed as they don't exist in events table

      const { data, error } = await query.order("start_datetime", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    const newFilters = {
      ...filters,
      [filterType]: filters[filterType].includes(value)
        ? filters[filterType].filter(v => v !== value)
        : [...filters[filterType], value]
    };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    newFilters[filterType].forEach(v => params.append(filterType, v));
    setSearchParams(params);
  };

  const getCountdown = (startDate: string) => {
    const diff = differenceInMilliseconds(new Date(startDate), new Date());
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} to go`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} to go`;
    return "Starting soon";
  };

  const getSeatsAvailable = (capacity: number, registered: number) => {
    const available = capacity - registered;
    if (available <= 0) return <Badge variant="destructive">Full</Badge>;
    if (available <= 5) return <Badge variant="secondary">{available} seats left</Badge>;
    return <Badge variant="outline">{available}/{capacity} seats</Badge>;
  };

  const glassCardClass =
    "border border-white/15 bg-white/10 text-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <SEO
        title="EdTech Events: Webinars, Workshops & Meetups"
        description="Join live EdTech webinars, workshops, and meetups. Browse upcoming and past events, and watch recordings to level up your classroom technology skills."
        canonicalUrl="https://schooltechhub.com/events"
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/3 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[32rem] w-[32rem] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-[20rem] w-[20rem] rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-24 md:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-10 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.65)] backdrop-blur-2xl md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35)_0%,_rgba(15,23,42,0)_70%)] opacity-80" />
          <div className="relative z-10 flex flex-col gap-6 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Badge className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                Live & On-Demand Learning
              </Badge>
              <Badge className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-sm font-medium text-white/80 backdrop-blur">
                Global Educator Community
              </Badge>
            </div>
            <h1 className="flex items-center justify-center gap-3 text-4xl font-semibold tracking-tight md:justify-start md:text-5xl">
              <CalendarClock className="h-10 w-10" />
              EdTech Events
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/75 md:mx-0">
              Join webinars, workshops, and meetups designed to level up your classroom technology practice. Explore upcoming sessions or catch up on recordings anytime.
            </p>
            <div className="mx-auto w-full max-w-2xl md:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 rounded-2xl border-white/20 bg-white/10 pl-12 text-base text-white placeholder:text-white/40 focus-visible:ring-white/40"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl">
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/15 bg-white/5 p-1 text-white/80 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {eventTypes.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="rounded-2xl text-sm data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        <section className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <Card className={cn(glassCardClass)}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-white/80">Delivery/Mode</h4>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    {filterOptions.eventMode.map((mode) => (
                      <label key={mode} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.eventMode.includes(mode)}
                          onChange={() => toggleFilter("eventMode", mode)}
                          className="h-4 w-4 rounded border-white/30 bg-white/10 text-sky-300 focus:ring-white/50"
                        />
                        <span>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white/80">Price Type</h4>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    {filterOptions.eventPriceType.map((type) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.eventPriceType.includes(type)}
                          onChange={() => toggleFilter("eventPriceType", type)}
                          className="h-4 w-4 rounded border-white/30 bg-white/10 text-sky-300 focus:ring-white/50"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white/80">Stage (Optional)</h4>
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    {filterOptions.stage.map((stage) => (
                      <label key={stage} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.stage.includes(stage)}
                          onChange={() => toggleFilter("stage", stage)}
                          className="h-4 w-4 rounded border-white/30 bg-white/10 text-sky-300 focus:ring-white/50"
                        />
                        <span>{stage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(glassCardClass, "p-0")}> 
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl font-semibold text-white">Newsletter</CardTitle>
                <p className="text-sm text-white/70">Get notified about upcoming events and recordings!</p>
              </CardHeader>
              <CardContent>
                <Button className="w-full rounded-2xl bg-white/90 text-slate-900 shadow-[0_15px_45px_-25px_rgba(226,232,240,0.9)] hover:bg-white">
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className={cn(glassCardClass, "flex h-64 items-center justify-center rounded-[2rem]")}> 
                <p className="text-white/70">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className={cn(glassCardClass, "rounded-[2rem] p-10 text-center text-white/70")}>
                No events found matching your criteria.
              </div>
            ) : (
              <div className="grid gap-6">
                {events.map((event) => {
                  const countdown = event.start_datetime ? getCountdown(event.start_datetime) : null;
                  const isPast = event.start_datetime && new Date(event.start_datetime) < new Date();

                  return (
                    <Card
                      key={event.id}
                      className={cn(
                        glassCardClass,
                        "overflow-hidden transition-all duration-300 hover:-translate-y-1",
                        isPast ? "opacity-80" : ""
                      )}
                    >
                      <CardContent className="space-y-6 p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Badge className="rounded-full border border-white/20 bg-white/10 text-xs uppercase tracking-wide text-white/80">
                              {event.event_type}
                            </Badge>
                            <Badge className="rounded-full border border-white/20 bg-white/10 text-xs uppercase tracking-wide text-white/70">
                              {event.event_mode}
                            </Badge>
                            {event.event_price_type && (
                              <Badge className="rounded-full border border-white/20 bg-white/10 text-xs uppercase tracking-wide text-white/80">
                                {event.event_price_type}
                                {event.price && event.event_price_type === "Paid" && ` $${event.price}`}
                              </Badge>
                            )}
                            {event.event_certificate_pd && (
                              <Badge className="flex items-center gap-1 rounded-full border border-purple-200/40 bg-purple-200/20 text-xs uppercase tracking-wide text-purple-100">
                                <Award className="h-3 w-3" />
                                PD Certificate
                              </Badge>
                            )}
                          </div>
                          {(!isPast && countdown) || (isPast && event.recording_url) ? (
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              {!isPast && countdown && (
                                <Badge className="rounded-full border border-rose-200/40 bg-rose-200/20 text-xs uppercase tracking-wide text-rose-100">
                                  {countdown}
                                </Badge>
                              )}
                              {isPast && event.recording_url && (
                                <Badge className="flex items-center gap-1 rounded-full border border-emerald-200/40 bg-emerald-200/20 text-xs uppercase tracking-wide text-emerald-100">
                                  <Video className="h-3 w-3" />
                                  Recording Available
                                </Badge>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold text-white">
                            <Link to={getLocalizedPath(`/events/${event.slug}`, language)} className="hover:text-white/80">
                              {event.title}
                            </Link>
                          </h3>
                          {event.subtitle && <p className="text-sm text-white/70">{event.subtitle}</p>}
                          <p className="text-sm text-white/70">{event.excerpt || "Click for more details..."}</p>
                        </div>

                        <div className="grid gap-4 text-sm text-white/65 md:grid-cols-2">
                          {event.start_datetime && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-white/50" />
                              {format(new Date(event.start_datetime), "MMM d, yyyy")}
                            </div>
                          )}
                          {event.start_datetime && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-white/50" />
                              {format(new Date(event.start_datetime), "h:mm a")} Bangkok
                            </div>
                          )}
                          {event.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-white/50" />
                              {event.venue}
                            </div>
                          )}
                          {event.event_capacity && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-white/50" />
                              {getSeatsAvailable(event.event_capacity, event.event_registered || 0)}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {!isPast && event.registration_url && (
                            <Button asChild className="rounded-2xl bg-white/90 text-slate-900 shadow-[0_15px_45px_-25px_rgba(226,232,240,0.9)] hover:bg-white">
                              <Link to={event.registration_url}>Register Now</Link>
                            </Button>
                          )}
                          {isPast && event.recording_url && (
                            <Button asChild variant="secondary" className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20">
                              <a href={event.recording_url} target="_blank" rel="noopener noreferrer">
                                Watch Recording
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            asChild
                            className="rounded-2xl border-white/30 text-white hover:bg-white/10 hover:text-white"
                          >
                            <Link to={getLocalizedPath(`/events/${event.slug}`, language)}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Events;
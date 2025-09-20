import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, Cpu, BookOpen, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPath } from "@/hooks/useLocalizedNavigate";

type FilterKey =
  | "contentType"
  | "deliveryType"
  | "payment"
  | "stage"
  | "subject"
  | "instructionType";

const Edutech = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({
    contentType: searchParams.getAll("contentType") || [],
    deliveryType: searchParams.getAll("deliveryType") || [],
    payment: searchParams.getAll("payment") || [],
    stage: searchParams.getAll("stage") || [],
    subject: searchParams.getAll("subject") || [],
    instructionType: searchParams.getAll("instructionType") || []
  });
  const { language, t } = useLanguage();

  const categories = [
    { value: "all", label: t.edutech.categories.all },
    { value: "Lesson Planning", label: t.edutech.categories.lessonPlanning },
    { value: "Lesson Delivery", label: t.edutech.categories.lessonDelivery },
    { value: "Engagement", label: t.edutech.categories.engagement },
    { value: "Evaluation", label: t.edutech.categories.evaluation }
  ];

  const filterOptions: Record<FilterKey, { value: string; label: string }[]> = {
    contentType: [
      { value: "tutorial", label: t.edutech.filters.groups.contentType.options.tutorial },
      { value: "teaching_technique", label: t.edutech.filters.groups.contentType.options.teachingTechnique },
      { value: "activity", label: t.edutech.filters.groups.contentType.options.activity }
    ],
    deliveryType: [
      { value: "In-class", label: t.edutech.filters.groups.deliveryType.options.inClass },
      { value: "Online", label: t.edutech.filters.groups.deliveryType.options.online },
      { value: "Hybrid", label: t.edutech.filters.groups.deliveryType.options.hybrid },
      { value: "Self-paced", label: t.edutech.filters.groups.deliveryType.options.selfPaced },
      { value: "Distance Learning", label: t.edutech.filters.groups.deliveryType.options.distanceLearning },
      { value: "Live", label: t.edutech.filters.groups.deliveryType.options.live }
    ],
    payment: [
      { value: "Free", label: t.edutech.filters.groups.payment.options.free },
      { value: "Freemium", label: t.edutech.filters.groups.payment.options.freemium },
      { value: "Paid", label: t.edutech.filters.groups.payment.options.paid },
      { value: "Free Trial", label: t.edutech.filters.groups.payment.options.freeTrial },
      { value: "Education Discount", label: t.edutech.filters.groups.payment.options.educationDiscount }
    ],
    stage: [
      { value: "Early Childhood", label: t.edutech.filters.groups.stage.options.earlyChildhood },
      { value: "Pre-K", label: t.edutech.filters.groups.stage.options.preK },
      { value: "Kindergarten", label: t.edutech.filters.groups.stage.options.kindergarten },
      { value: "Lower Primary", label: t.edutech.filters.groups.stage.options.lowerPrimary },
      { value: "Upper Primary", label: t.edutech.filters.groups.stage.options.upperPrimary },
      { value: "Primary", label: t.edutech.filters.groups.stage.options.primary },
      { value: "Secondary", label: t.edutech.filters.groups.stage.options.secondary },
      { value: "High School", label: t.edutech.filters.groups.stage.options.highSchool },
      { value: "K-12", label: t.edutech.filters.groups.stage.options.k12 },
      { value: "K-5", label: t.edutech.filters.groups.stage.options.k5 }
    ],
    subject: [
      { value: "Phonics", label: t.edutech.filters.groups.subject.options.phonics },
      { value: "Reading", label: t.edutech.filters.groups.subject.options.reading },
      { value: "Writing", label: t.edutech.filters.groups.subject.options.writing },
      { value: "Grammar", label: t.edutech.filters.groups.subject.options.grammar },
      { value: "Spelling", label: t.edutech.filters.groups.subject.options.spelling },
      { value: "Vocabulary", label: t.edutech.filters.groups.subject.options.vocabulary },
      { value: "English/ELA", label: t.edutech.filters.groups.subject.options.englishEla },
      { value: "Math", label: t.edutech.filters.groups.subject.options.math },
      { value: "Science", label: t.edutech.filters.groups.subject.options.science },
      { value: "Biology", label: t.edutech.filters.groups.subject.options.biology },
      { value: "Chemistry", label: t.edutech.filters.groups.subject.options.chemistry },
      { value: "Physics", label: t.edutech.filters.groups.subject.options.physics },
      { value: "Earth Science", label: t.edutech.filters.groups.subject.options.earthScience },
      { value: "ICT", label: t.edutech.filters.groups.subject.options.ict },
      { value: "STEM", label: t.edutech.filters.groups.subject.options.stem },
      { value: "STEAM", label: t.edutech.filters.groups.subject.options.steam }
    ],
    instructionType: [
      { value: "Direct Instruction", label: t.edutech.filters.groups.instructionType.options.directInstruction },
      { value: "Differentiated Instruction", label: t.edutech.filters.groups.instructionType.options.differentiatedInstruction },
      { value: "Inquiry-Based Learning", label: t.edutech.filters.groups.instructionType.options.inquiryBasedLearning },
      { value: "Project-Based Learning", label: t.edutech.filters.groups.instructionType.options.projectBasedLearning },
      { value: "Problem-Based Learning", label: t.edutech.filters.groups.instructionType.options.problemBasedLearning },
      { value: "Play-Based Learning", label: t.edutech.filters.groups.instructionType.options.playBasedLearning },
      { value: "Game-Based Learning", label: t.edutech.filters.groups.instructionType.options.gameBasedLearning },
      { value: "Gamification", label: t.edutech.filters.groups.instructionType.options.gamification },
      { value: "Cooperative Learning", label: t.edutech.filters.groups.instructionType.options.cooperativeLearning },
      { value: "Experiential Learning", label: t.edutech.filters.groups.instructionType.options.experientialLearning },
      { value: "Design Thinking", label: t.edutech.filters.groups.instructionType.options.designThinking },
      { value: "Socratic Seminar", label: t.edutech.filters.groups.instructionType.options.socraticSeminar },
      { value: "Station Rotation", label: t.edutech.filters.groups.instructionType.options.stationRotation },
      { value: "Blended Learning", label: t.edutech.filters.groups.instructionType.options.blendedLearning }
    ]
  };

  const contentTypeIcons = {
    tutorial: <BookOpen className="h-4 w-4" />,
    teaching_technique: <Cpu className="h-4 w-4" />,
    activity: <Activity className="h-4 w-4" />
  };

  const contentTypeLabels: Record<string, string> = {
    tutorial: t.edutech.filters.groups.contentType.options.tutorial,
    teaching_technique: t.edutech.filters.groups.contentType.options.teachingTechnique,
    activity: t.edutech.filters.groups.contentType.options.activity
  };

  const filterOptionLabelMap = Object.entries(filterOptions).reduce(
    (acc, [key, options]) => {
      acc[key as FilterKey] = options.reduce<Record<string, string>>((optionAcc, option) => {
        optionAcc[option.value] = option.label;
        return optionAcc;
      }, {});
      return acc;
    },
    {} as Record<FilterKey, Record<string, string>>
  );

  const getLocalizedFilterValue = (filterType: FilterKey, value?: string | null) => {
    if (!value) return value;
    return filterOptionLabelMap[filterType][value] ?? value;
  };

  useEffect(() => {
    fetchContent();
  }, [searchTerm, selectedCategory, filters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_master")
        .select("*")
        .eq("page", "edutech")
        .eq("is_published", true);

      if (selectedCategory !== "all") {
        query = query.or(`category.eq.${selectedCategory},subcategory.eq.${selectedCategory}`);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      if (filters.contentType.length > 0) {
        query = query.in("content_type", filters.contentType as any);
      }

      if (filters.deliveryType.length > 0) {
        query = query.in("delivery_type", filters.deliveryType as any);
      }

      if (filters.payment.length > 0) {
        query = query.in("payment", filters.payment as any);
      }

      if (filters.stage.length > 0) {
        query = query.in("stage", filters.stage as any);
      }

      if (filters.subject.length > 0) {
        query = query.in("subject", filters.subject as any);
      }

      if (filters.instructionType.length > 0) {
        query = query.in("delivery_type", filters.instructionType as any);
      }

      const { data, error } = await query.order("published_at", { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: FilterKey, value: string) => {
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

  const getPrepLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low prep": return "bg-green-100 text-green-800";
      case "medium prep": return "bg-yellow-100 text-yellow-800";
      case "high prep": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Edutech Hub: Tutorials, Techniques & Lesson Planning"
        description="Learn classroom technology the practical way: tutorials, teaching techniques, activities, and AI lesson planning. Filter by grade, subject, and time to implement."
        canonicalUrl="https://schooltechhub.com/edutech"
      />
      <main className="flex-1">
          <div className="container py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">{t.edutech.title}</h1>
              <p className="text-muted-foreground">
                {t.edutech.subtitle}
              </p>
            </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.edutech.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.edutech.filters.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.contentType.title}</h4>
                      {filterOptions.contentType.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.contentType.includes(option.value)}
                            onChange={() => toggleFilter("contentType", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm flex items-center gap-1">
                            {contentTypeIcons[option.value as keyof typeof contentTypeIcons]}
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.deliveryType.title}</h4>
                      {filterOptions.deliveryType.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.deliveryType.includes(option.value)}
                            onChange={() => toggleFilter("deliveryType", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.payment.title}</h4>
                      {filterOptions.payment.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.payment.includes(option.value)}
                            onChange={() => toggleFilter("payment", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.stage.title}</h4>
                      {filterOptions.stage.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.stage.includes(option.value)}
                            onChange={() => toggleFilter("stage", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.subject.title}</h4>
                      {filterOptions.subject.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.subject.includes(option.value)}
                            onChange={() => toggleFilter("subject", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">{t.edutech.filters.groups.instructionType.title}</h4>
                      {filterOptions.instructionType.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={filters.instructionType.includes(option.value)}
                            onChange={() => toggleFilter("instructionType", option.value)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            </div>

              <div className="lg:col-span-3">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground">{t.edutech.states.loading}</p>
                  </div>
                ) : content.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{t.edutech.states.empty}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {content.map((item) => (
                      <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {contentTypeIcons[item.content_type as keyof typeof contentTypeIcons]}
                                {contentTypeLabels[item.content_type] ?? item.content_type}
                              </Badge>
                              {item.prep_level && (
                                <Badge className={getPrepLevelColor(item.prep_level)}>
                                  {item.prep_level}
                                </Badge>
                              )}
                            </div>
                            {item.delivery_type && (
                              <Badge variant="outline">
                                {getLocalizedFilterValue("deliveryType", item.delivery_type)}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold mb-2">
                            <Link
                              to={getLocalizedPath(`/edutech/${item.slug}`, language)}
                              className="hover:text-primary"
                            >
                              {item.title}
                            </Link>
                          </h3>

                          {item.subtitle && (
                            <p className="text-sm text-muted-foreground mb-2">{item.subtitle}</p>
                          )}

                          <p className="text-sm text-muted-foreground mb-4">
                            {item.excerpt || t.edutech.cta.learnMore}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.stage && (
                              <Badge variant="outline">
                                {getLocalizedFilterValue("stage", item.stage)}
                              </Badge>
                            )}
                            {item.subject && (
                              <Badge variant="outline">
                                {getLocalizedFilterValue("subject", item.subject)}
                              </Badge>
                            )}
                            {item.payment && (
                              <Badge variant="outline">
                                {getLocalizedFilterValue("payment", item.payment)}
                              </Badge>
                            )}
                            {item.time_required && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.time_required}
                              </Badge>
                            )}
                          </div>
                        
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Edutech;
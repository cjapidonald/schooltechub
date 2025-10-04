import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'Organization' | 'Service' | 'FAQPage' | 'BreadcrumbList' | 'Article' | 'Course';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    switch (type) {
      case 'Organization': {
        const defaultOrganization = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SchoolTech Hub",
          "alternateName": "STH",
          "url": "https://schooltechhub.com",
          "logo": "https://schooltechhub.com/logo.png",
          "description": "Leading AI-powered educational technology solutions for modern classrooms",
          "foundingDate": "2020",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-800-555-0100",
            "contactType": "customer service",
            "areaServed": ["US", "GB", "CA", "AU"],
            "availableLanguage": ["English"],
          },
          "sameAs": [
            "https://facebook.com/schooltechhub",
            "https://twitter.com/schooltechhub",
            "https://linkedin.com/company/schooltechhub",
            "https://instagram.com/schooltechhub",
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Innovation Way",
            "addressLocality": "Remote",
            "addressRegion": "Global",
            "postalCode": "00000",
            "addressCountry": "US",
          },
        };

        const mergedOrganization = {
          ...defaultOrganization,
          ...data,
        };

        if (data?.contactPoint) {
          mergedOrganization.contactPoint = {
            ...defaultOrganization.contactPoint,
            ...data.contactPoint,
          };
        }

        if (data?.address) {
          mergedOrganization.address = {
            ...defaultOrganization.address,
            ...data.address,
          };
        }

        if (data?.sameAs) {
          mergedOrganization.sameAs = data.sameAs;
        }

        return mergedOrganization;
      }
      
      case 'Service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": data.serviceType || "Educational Technology Consulting",
          "provider": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "areaServed": {
            "@type": "Country",
            "name": ["United States", "Canada", "United Kingdom", "Australia"]
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Educational Technology Services",
            "itemListElement": data.services || [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "1:1 Consulting",
                  "description": "Personalized EdTech consulting for educators",
                  "price": "30.00",
                  "priceCurrency": "USD"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Whole School Consulting",
                  "description": "Comprehensive EdTech transformation for schools",
                  "price": "60.00",
                  "priceCurrency": "USD"
                }
              }
            ]
          }
        };
      
      case 'FAQPage':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.questions || []
        };
      
      case 'BreadcrumbList':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.items || []
        };
      
      case 'Article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.headline,
          "description": data.description,
          "image": data.image,
          "author": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "publisher": {
            "@type": "Organization",
            "name": "SchoolTech Hub",
            "logo": {
              "@type": "ImageObject",
              "url": "https://schooltechhub.com/logo.png"
            }
          },
          "datePublished": data.datePublished,
          "dateModified": data.dateModified || data.datePublished,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url
          }
        };
      
      case 'Course':
        return {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": data.name,
          "description": data.description,
          "provider": {
            "@type": "Organization",
            "name": "SchoolTech Hub"
          },
          "educationalLevel": data.level || "Professional Development",
          "teaches": data.skills || [],
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "Online",
            "duration": data.duration || "P1M"
          }
        };
      
      default:
        return null;
    }
  };

  const schema = generateSchema();
  
  if (!schema) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
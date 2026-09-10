import { emptyCvDraft, type CvDraft } from "../../src/lib/cv/contracts";

export function cvFixture(): CvDraft {
  return {
    ...emptyCvDraft(),
    title: "Amina's operations CV",
    personal: {
      fullName: "Amina Mwangi",
      headline: "Customer operations specialist",
      email: "amina@example.test",
      phone: "+254 700 000 000",
      location: "Nairobi, Kenya",
      website: "",
      linkedin: "linkedin.com/in/amina-example",
    },
    summary:
      "Customer operations specialist experienced in resolving support cases, coordinating reporting, and improving team documentation.",
    experience: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        role: "Customer operations associate",
        company: "Nyota Services",
        location: "Nairobi",
        startDate: "Jan 2022",
        endDate: "Present",
        description:
          "- Resolved 45 customer cases daily while maintaining service standards.\n- Coordinated weekly reporting across support, sales, and finance.\n- Built a handover tracker that reduced repeated escalations.",
      },
    ],
    education: [
      {
        id: "10000000-0000-4000-8000-000000000002",
        degree: "Diploma in Business Management",
        institution: "Nairobi Training Institute",
        location: "Nairobi",
        startDate: "2019",
        endDate: "2021",
        details:
          "Coursework in operations, communication, and business reporting.",
      },
    ],
    skills:
      "Customer support · Excel reporting · CRM administration · Stakeholder communication",
    projects: [
      {
        id: "10000000-0000-4000-8000-000000000003",
        name: "Team knowledge library",
        details:
          "Organized support documentation to make handovers easier and keep service guidance current.",
      },
    ],
    certifications: "Customer Service Foundations, 2023",
    achievements:
      "Recognized for improving team documentation during a product change.",
    languages: "English · Kiswahili",
  };
}

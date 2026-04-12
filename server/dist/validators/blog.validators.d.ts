/**
 * Blog CMS Zod validators
 *
 * Validates all block types and post metadata on save.
 */
import { z } from 'zod';
export declare const ContentBlockSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"text">;
    props: z.ZodObject<{
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
    }, {
        content: string;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "text";
    id: string;
    props: {
        content: string;
    };
}, {
    type: "text";
    id: string;
    props: {
        content: string;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"heading">;
    props: z.ZodObject<{
        text: z.ZodString;
        level: z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        level: 2 | 3 | 4;
    }, {
        text: string;
        level: 2 | 3 | 4;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "heading";
    id: string;
    props: {
        text: string;
        level: 2 | 3 | 4;
    };
}, {
    type: "heading";
    id: string;
    props: {
        text: string;
        level: 2 | 3 | 4;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"image">;
    props: z.ZodObject<{
        src: z.ZodString;
        alt: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
        width: z.ZodDefault<z.ZodEnum<["full", "wide", "content"]>>;
    }, "strip", z.ZodTypeAny, {
        width: "content" | "full" | "wide";
        src: string;
        alt: string;
        caption?: string | undefined;
    }, {
        src: string;
        alt: string;
        width?: "content" | "full" | "wide" | undefined;
        caption?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "image";
    id: string;
    props: {
        width: "content" | "full" | "wide";
        src: string;
        alt: string;
        caption?: string | undefined;
    };
}, {
    type: "image";
    id: string;
    props: {
        src: string;
        alt: string;
        width?: "content" | "full" | "wide" | undefined;
        caption?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"two_column">;
    props: z.ZodObject<{
        left: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
        right: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
    }, "strip", z.ZodTypeAny, {
        left: unknown[];
        right: unknown[];
    }, {
        left: unknown[];
        right: unknown[];
    }>;
}, "strip", z.ZodTypeAny, {
    type: "two_column";
    id: string;
    props: {
        left: unknown[];
        right: unknown[];
    };
}, {
    type: "two_column";
    id: string;
    props: {
        left: unknown[];
        right: unknown[];
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"callout">;
    props: z.ZodObject<{
        type: z.ZodEnum<["tip", "warning", "info", "example"]>;
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        body: string;
        type: "info" | "warning" | "tip" | "example";
        title?: string | undefined;
    }, {
        body: string;
        type: "info" | "warning" | "tip" | "example";
        title?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "callout";
    id: string;
    props: {
        body: string;
        type: "info" | "warning" | "tip" | "example";
        title?: string | undefined;
    };
}, {
    type: "callout";
    id: string;
    props: {
        body: string;
        type: "info" | "warning" | "tip" | "example";
        title?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"code">;
    props: z.ZodObject<{
        language: z.ZodString;
        code: z.ZodString;
        filename: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        code: string;
        filename?: string | undefined;
    }, {
        language: string;
        code: string;
        filename?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "code";
    id: string;
    props: {
        language: string;
        code: string;
        filename?: string | undefined;
    };
}, {
    type: "code";
    id: string;
    props: {
        language: string;
        code: string;
        filename?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"quote">;
    props: z.ZodObject<{
        text: z.ZodString;
        attribution: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        attribution?: string | undefined;
    }, {
        text: string;
        attribution?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "quote";
    id: string;
    props: {
        text: string;
        attribution?: string | undefined;
    };
}, {
    type: "quote";
    id: string;
    props: {
        text: string;
        attribution?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"divider">;
    props: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
}, "strip", z.ZodTypeAny, {
    type: "divider";
    id: string;
    props: {} & {
        [k: string]: unknown;
    };
}, {
    type: "divider";
    id: string;
    props: {} & {
        [k: string]: unknown;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"embed">;
    props: z.ZodObject<{
        url: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        caption?: string | undefined;
    }, {
        url: string;
        caption?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "embed";
    id: string;
    props: {
        url: string;
        caption?: string | undefined;
    };
}, {
    type: "embed";
    id: string;
    props: {
        url: string;
        caption?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"cta">;
    props: z.ZodObject<{
        text: z.ZodString;
        url: z.ZodString;
        variant: z.ZodEnum<["primary", "secondary"]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        url: string;
        variant: "primary" | "secondary";
    }, {
        text: string;
        url: string;
        variant: "primary" | "secondary";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "cta";
    id: string;
    props: {
        text: string;
        url: string;
        variant: "primary" | "secondary";
    };
}, {
    type: "cta";
    id: string;
    props: {
        text: string;
        url: string;
        variant: "primary" | "secondary";
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"stat_highlight">;
    props: z.ZodObject<{
        stat: z.ZodString;
        description: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        stat: string;
        source?: string | undefined;
    }, {
        description: string;
        stat: string;
        source?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "stat_highlight";
    id: string;
    props: {
        description: string;
        stat: string;
        source?: string | undefined;
    };
}, {
    type: "stat_highlight";
    id: string;
    props: {
        description: string;
        stat: string;
        source?: string | undefined;
    };
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"audit_link">;
    props: z.ZodObject<{
        ruleId: z.ZodString;
        customText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ruleId: string;
        customText?: string | undefined;
    }, {
        ruleId: string;
        customText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "audit_link";
    id: string;
    props: {
        ruleId: string;
        customText?: string | undefined;
    };
}, {
    type: "audit_link";
    id: string;
    props: {
        ruleId: string;
        customText?: string | undefined;
    };
}>]>;
export declare const PostCategorySchema: z.ZodEnum<["seo", "accessibility", "security", "performance", "content-quality", "structured-data", "eeat", "aeo", "guides", "case-studies", "product-updates"]>;
export declare const SchemaTypeSchema: z.ZodEnum<["article", "howto", "faq", "claim_review"]>;
export declare const ReviewRatingSchema: z.ZodEnum<["True", "MostlyTrue", "Mixed", "MostlyFalse", "False"]>;
export declare const CreatePostSchema: z.ZodObject<{
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    excerpt: z.ZodString;
    featured_image_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    featured_image_alt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"text">;
        props: z.ZodObject<{
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
        }, {
            content: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        id: string;
        props: {
            content: string;
        };
    }, {
        type: "text";
        id: string;
        props: {
            content: string;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"heading">;
        props: z.ZodObject<{
            text: z.ZodString;
            level: z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            level: 2 | 3 | 4;
        }, {
            text: string;
            level: 2 | 3 | 4;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    }, {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"image">;
        props: z.ZodObject<{
            src: z.ZodString;
            alt: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            width: z.ZodDefault<z.ZodEnum<["full", "wide", "content"]>>;
        }, "strip", z.ZodTypeAny, {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        }, {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        id: string;
        props: {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        };
    }, {
        type: "image";
        id: string;
        props: {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"two_column">;
        props: z.ZodObject<{
            left: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
            right: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
        }, "strip", z.ZodTypeAny, {
            left: unknown[];
            right: unknown[];
        }, {
            left: unknown[];
            right: unknown[];
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    }, {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"callout">;
        props: z.ZodObject<{
            type: z.ZodEnum<["tip", "warning", "info", "example"]>;
            title: z.ZodOptional<z.ZodString>;
            body: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        }, {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    }, {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"code">;
        props: z.ZodObject<{
            language: z.ZodString;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            language: string;
            code: string;
            filename?: string | undefined;
        }, {
            language: string;
            code: string;
            filename?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    }, {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"quote">;
        props: z.ZodObject<{
            text: z.ZodString;
            attribution: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            attribution?: string | undefined;
        }, {
            text: string;
            attribution?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    }, {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"divider">;
        props: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    }, "strip", z.ZodTypeAny, {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    }, {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"embed">;
        props: z.ZodObject<{
            url: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            caption?: string | undefined;
        }, {
            url: string;
            caption?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    }, {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"cta">;
        props: z.ZodObject<{
            text: z.ZodString;
            url: z.ZodString;
            variant: z.ZodEnum<["primary", "secondary"]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        }, {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    }, {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"stat_highlight">;
        props: z.ZodObject<{
            stat: z.ZodString;
            description: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            stat: string;
            source?: string | undefined;
        }, {
            description: string;
            stat: string;
            source?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    }, {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"audit_link">;
        props: z.ZodObject<{
            ruleId: z.ZodString;
            customText: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ruleId: string;
            customText?: string | undefined;
        }, {
            ruleId: string;
            customText?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    }, {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    }>]>, "many">;
    category: z.ZodEnum<["seo", "accessibility", "security", "performance", "content-quality", "structured-data", "eeat", "aeo", "guides", "case-studies", "product-updates"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    seo_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    seo_description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    schema_type: z.ZodDefault<z.ZodEnum<["article", "howto", "faq", "claim_review"]>>;
    schema_claim_reviewed: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    schema_review_rating: z.ZodOptional<z.ZodNullable<z.ZodEnum<["True", "MostlyTrue", "Mixed", "MostlyFalse", "False"]>>>;
}, "strip", z.ZodTypeAny, {
    content: ({
        type: "text";
        id: string;
        props: {
            content: string;
        };
    } | {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    } | {
        type: "image";
        id: string;
        props: {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        };
    } | {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    } | {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    } | {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    } | {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    } | {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    } | {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    } | {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    } | {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    } | {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    })[];
    title: string;
    category: "seo" | "accessibility" | "security" | "performance" | "structured-data" | "eeat" | "content-quality" | "aeo" | "guides" | "case-studies" | "product-updates";
    excerpt: string;
    tags: string[];
    schema_type: "article" | "faq" | "howto" | "claim_review";
    subtitle?: string | null | undefined;
    featured_image_url?: string | null | undefined;
    featured_image_alt?: string | null | undefined;
    seo_title?: string | null | undefined;
    seo_description?: string | null | undefined;
    schema_claim_reviewed?: string | null | undefined;
    schema_review_rating?: "True" | "MostlyTrue" | "Mixed" | "MostlyFalse" | "False" | null | undefined;
}, {
    content: ({
        type: "text";
        id: string;
        props: {
            content: string;
        };
    } | {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    } | {
        type: "image";
        id: string;
        props: {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        };
    } | {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    } | {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    } | {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    } | {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    } | {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    } | {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    } | {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    } | {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    } | {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    })[];
    title: string;
    category: "seo" | "accessibility" | "security" | "performance" | "structured-data" | "eeat" | "content-quality" | "aeo" | "guides" | "case-studies" | "product-updates";
    excerpt: string;
    subtitle?: string | null | undefined;
    featured_image_url?: string | null | undefined;
    featured_image_alt?: string | null | undefined;
    tags?: string[] | undefined;
    seo_title?: string | null | undefined;
    seo_description?: string | null | undefined;
    schema_type?: "article" | "faq" | "howto" | "claim_review" | undefined;
    schema_claim_reviewed?: string | null | undefined;
    schema_review_rating?: "True" | "MostlyTrue" | "Mixed" | "MostlyFalse" | "False" | null | undefined;
}>;
export declare const UpdatePostSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    excerpt: z.ZodOptional<z.ZodString>;
    featured_image_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    featured_image_alt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"text">;
        props: z.ZodObject<{
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
        }, {
            content: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        id: string;
        props: {
            content: string;
        };
    }, {
        type: "text";
        id: string;
        props: {
            content: string;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"heading">;
        props: z.ZodObject<{
            text: z.ZodString;
            level: z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            level: 2 | 3 | 4;
        }, {
            text: string;
            level: 2 | 3 | 4;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    }, {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"image">;
        props: z.ZodObject<{
            src: z.ZodString;
            alt: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            width: z.ZodDefault<z.ZodEnum<["full", "wide", "content"]>>;
        }, "strip", z.ZodTypeAny, {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        }, {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "image";
        id: string;
        props: {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        };
    }, {
        type: "image";
        id: string;
        props: {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"two_column">;
        props: z.ZodObject<{
            left: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
            right: z.ZodArray<z.ZodType<unknown, z.ZodTypeDef, unknown>, "many">;
        }, "strip", z.ZodTypeAny, {
            left: unknown[];
            right: unknown[];
        }, {
            left: unknown[];
            right: unknown[];
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    }, {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"callout">;
        props: z.ZodObject<{
            type: z.ZodEnum<["tip", "warning", "info", "example"]>;
            title: z.ZodOptional<z.ZodString>;
            body: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        }, {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    }, {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"code">;
        props: z.ZodObject<{
            language: z.ZodString;
            code: z.ZodString;
            filename: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            language: string;
            code: string;
            filename?: string | undefined;
        }, {
            language: string;
            code: string;
            filename?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    }, {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"quote">;
        props: z.ZodObject<{
            text: z.ZodString;
            attribution: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            attribution?: string | undefined;
        }, {
            text: string;
            attribution?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    }, {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"divider">;
        props: z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>;
    }, "strip", z.ZodTypeAny, {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    }, {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"embed">;
        props: z.ZodObject<{
            url: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            caption?: string | undefined;
        }, {
            url: string;
            caption?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    }, {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"cta">;
        props: z.ZodObject<{
            text: z.ZodString;
            url: z.ZodString;
            variant: z.ZodEnum<["primary", "secondary"]>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        }, {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    }, {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"stat_highlight">;
        props: z.ZodObject<{
            stat: z.ZodString;
            description: z.ZodString;
            source: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            stat: string;
            source?: string | undefined;
        }, {
            description: string;
            stat: string;
            source?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    }, {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"audit_link">;
        props: z.ZodObject<{
            ruleId: z.ZodString;
            customText: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            ruleId: string;
            customText?: string | undefined;
        }, {
            ruleId: string;
            customText?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    }, {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    }>]>, "many">>;
    category: z.ZodOptional<z.ZodEnum<["seo", "accessibility", "security", "performance", "content-quality", "structured-data", "eeat", "aeo", "guides", "case-studies", "product-updates"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    seo_title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    seo_description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    related_post_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    schema_type: z.ZodOptional<z.ZodEnum<["article", "howto", "faq", "claim_review"]>>;
    schema_claim_reviewed: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    schema_review_rating: z.ZodOptional<z.ZodNullable<z.ZodEnum<["True", "MostlyTrue", "Mixed", "MostlyFalse", "False"]>>>;
}, "strip", z.ZodTypeAny, {
    content?: ({
        type: "text";
        id: string;
        props: {
            content: string;
        };
    } | {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    } | {
        type: "image";
        id: string;
        props: {
            width: "content" | "full" | "wide";
            src: string;
            alt: string;
            caption?: string | undefined;
        };
    } | {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    } | {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    } | {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    } | {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    } | {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    } | {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    } | {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    } | {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    } | {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    })[] | undefined;
    title?: string | undefined;
    category?: "seo" | "accessibility" | "security" | "performance" | "structured-data" | "eeat" | "content-quality" | "aeo" | "guides" | "case-studies" | "product-updates" | undefined;
    subtitle?: string | null | undefined;
    excerpt?: string | undefined;
    featured_image_url?: string | null | undefined;
    featured_image_alt?: string | null | undefined;
    tags?: string[] | undefined;
    seo_title?: string | null | undefined;
    seo_description?: string | null | undefined;
    schema_type?: "article" | "faq" | "howto" | "claim_review" | undefined;
    schema_claim_reviewed?: string | null | undefined;
    schema_review_rating?: "True" | "MostlyTrue" | "Mixed" | "MostlyFalse" | "False" | null | undefined;
    related_post_ids?: string[] | undefined;
}, {
    content?: ({
        type: "text";
        id: string;
        props: {
            content: string;
        };
    } | {
        type: "heading";
        id: string;
        props: {
            text: string;
            level: 2 | 3 | 4;
        };
    } | {
        type: "image";
        id: string;
        props: {
            src: string;
            alt: string;
            width?: "content" | "full" | "wide" | undefined;
            caption?: string | undefined;
        };
    } | {
        type: "callout";
        id: string;
        props: {
            body: string;
            type: "info" | "warning" | "tip" | "example";
            title?: string | undefined;
        };
    } | {
        type: "code";
        id: string;
        props: {
            language: string;
            code: string;
            filename?: string | undefined;
        };
    } | {
        type: "quote";
        id: string;
        props: {
            text: string;
            attribution?: string | undefined;
        };
    } | {
        type: "divider";
        id: string;
        props: {} & {
            [k: string]: unknown;
        };
    } | {
        type: "embed";
        id: string;
        props: {
            url: string;
            caption?: string | undefined;
        };
    } | {
        type: "cta";
        id: string;
        props: {
            text: string;
            url: string;
            variant: "primary" | "secondary";
        };
    } | {
        type: "stat_highlight";
        id: string;
        props: {
            description: string;
            stat: string;
            source?: string | undefined;
        };
    } | {
        type: "audit_link";
        id: string;
        props: {
            ruleId: string;
            customText?: string | undefined;
        };
    } | {
        type: "two_column";
        id: string;
        props: {
            left: unknown[];
            right: unknown[];
        };
    })[] | undefined;
    title?: string | undefined;
    category?: "seo" | "accessibility" | "security" | "performance" | "structured-data" | "eeat" | "content-quality" | "aeo" | "guides" | "case-studies" | "product-updates" | undefined;
    subtitle?: string | null | undefined;
    excerpt?: string | undefined;
    featured_image_url?: string | null | undefined;
    featured_image_alt?: string | null | undefined;
    tags?: string[] | undefined;
    seo_title?: string | null | undefined;
    seo_description?: string | null | undefined;
    schema_type?: "article" | "faq" | "howto" | "claim_review" | undefined;
    schema_claim_reviewed?: string | null | undefined;
    schema_review_rating?: "True" | "MostlyTrue" | "Mixed" | "MostlyFalse" | "False" | null | undefined;
    related_post_ids?: string[] | undefined;
}>;
//# sourceMappingURL=blog.validators.d.ts.map
export interface ParsedFilters {
  word_count?: number;
  is_palindrome?: boolean;
  min_length?: number;
  max_length?: number;
  contains_character?: string;
}

export interface InterpretedQuery {
  original: string;
  parsed_filters: ParsedFilters;
}

export interface NaturalLanguageResponse {
  data: any[];
  count: number;
  interpreted_query: InterpretedQuery;
}

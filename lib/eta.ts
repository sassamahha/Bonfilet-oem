  const normalizedCountry = country.toUpperCase();
  const entry = config.country_zone[normalizedCountry];
  const base = config.base_production_days;
  if (!entry) {
    return [base + 5, base + 10];
  }
  return [base + entry.days[0], base + entry.days[1]];
}

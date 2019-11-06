import { Arg, Args } from 'type-graphql';
import FuzzySearch from '../utils/FuzzySearch';
import pokedex from '../assets/pokedex';
import { pokedexAliases } from '../assets/aliases';
import Pokemon from '../typings/pokemon';
import { SimpleFuseOptions } from '../typings/common';
import DetailsEntry from '../structures/DetailsEntry';
import DexEntry from '../structures/DexEntry';
import PaginatedArgs from '../arguments/PaginatedArgs';
import { GraphQLJSONObject } from 'graphql-type-json';

export default class DexService {
  private replaceSpacesRegex = new RegExp(/ /, 'g');

  public findByNum(@Arg('num') num: number) {
    return pokedex.find(poke => poke.num === num);
  }

  public findBySpecies(@Arg('species') species: string) {
    return pokedex.get(species);
  }

  public findByFuzzy(@Args() {
    query, skip, take, reverse,
  }: PaginatedArgs, @Arg('fuseOptions', () => GraphQLJSONObject) fuseOptions?: SimpleFuseOptions) {
    if (query.split(' ')[0] === 'mega') {
      query = `${query.substring(query.split(' ')[0].length + 1)}-mega`;
    }

    const queryResults: DexEntry[] = [];
    const fuzzyPokemon = new FuzzySearch(pokedex, [ 'num', 'species' ], { threshold: 0.3, ...fuseOptions });

    let fuzzyResult = fuzzyPokemon.run(query);

    if (!fuzzyResult.length) {
      const fuzzyAliasResult = new FuzzySearch(pokedexAliases, [ 'alias', 'name' ], { threshold: 0.4 }).run(query);

      if (fuzzyAliasResult.length) {
        fuzzyResult = fuzzyPokemon.run(fuzzyAliasResult[0].name);
      }
    }

    if (!fuzzyResult.length) {
      throw new Error(`No pokemon found ${query}`);
    }

    if (reverse) {
      fuzzyResult.reverse();
    }

    const paginatedFuzzyResult = fuzzyResult.slice(skip, skip + take);

    for (const page of paginatedFuzzyResult) {
      const dexEntry = new DexEntry();
      dexEntry.num = page.num;
      dexEntry.species = page.species;
      dexEntry.types = page.types;
      dexEntry.abilities = page.abilities;
      dexEntry.baseStats = page.baseStats;
      dexEntry.color = page.color;
      dexEntry.eggGroups = page.eggGroups || undefined;
      dexEntry.evolutionLevel = page.evoLevel || undefined;
      dexEntry.evos = page.evos || undefined;
      dexEntry.prevo = page.prevo || undefined;
      dexEntry.forme = page.forme || undefined;
      dexEntry.formeLetter = page.formeLetter || undefined;
      dexEntry.gender = page.gender || undefined;
      dexEntry.genderRatio = page.genderRatio || undefined;
      dexEntry.height = page.heightm;
      dexEntry.weight = page.weightkg;
      dexEntry.baseForme = page.baseForme || undefined;
      dexEntry.baseSpecies = page.baseSpecies || undefined;
      dexEntry.otherFormes = page.otherFormes || undefined;

      queryResults.push(dexEntry);
    }

    return queryResults;
  }

  public async findBySpeciesWithDetails(@Args() {
    query, skip, take, reverse,
  }: PaginatedArgs, parsingPokemon = '') {
    const basePokemonData = this.findBySpecies(query);

    if (!basePokemonData) {
      throw new Error(`No pokemon found for ${query}`);
    }

    const [ flavorsImport, tiersImport ] = await Promise.all([
      import('../assets/flavorText.json'),
      import('../assets/formats.json')
    ]);

    const { default: flavors } = flavorsImport as { default: Record<string, Pokemon.FlavorText[]> };
    const { default: tiers } = tiersImport as { default: Record<string, string> };

    const pokemonData = new DetailsEntry();
    const evolutionChain: Promise<DetailsEntry>[] = [];
    const preevolutionChain: Promise<DetailsEntry>[] = [];

    pokemonData.num = basePokemonData.num;
    pokemonData.species = basePokemonData.species;
    pokemonData.types = basePokemonData.types;
    pokemonData.abilities = basePokemonData.abilities;
    pokemonData.baseStats = basePokemonData.baseStats;
    pokemonData.color = basePokemonData.color;
    pokemonData.eggGroups = basePokemonData.eggGroups || undefined;
    pokemonData.evolutionLevel = basePokemonData.evoLevel || undefined;
    pokemonData.genderData = basePokemonData.gender
      ? this.getFullGenderName(basePokemonData.gender)
      : this.parseGenderRatio(
        basePokemonData.genderRatio
          ? basePokemonData.genderRatio
          : { M: 0.5, F: 0.5 }
      );
    pokemonData.smogonTier = tiers[query.replace(/([-% ])/gm, '')] || 'Undiscovered';
    pokemonData.height = basePokemonData.heightm;
    pokemonData.weight = basePokemonData.weightkg;
    pokemonData.baseForme = basePokemonData.baseForme;
    pokemonData.baseSpecies = basePokemonData.baseSpecies;
    pokemonData.otherFormes = basePokemonData.otherFormes;
    pokemonData.flavorTexts = [];
    pokemonData.sprite = `https://play.pokemonshowdown.com/sprites/ani/${basePokemonData.species.replace(/ /g, '').toLowerCase()}`;
    pokemonData.shinySprite = `https://play.pokemonshowdown.com/sprites/ani-shiny/${basePokemonData.species.replace(/ /g, '').toLowerCase()}`;
    pokemonData.bulbapediaPage = basePokemonData.num >= 1 ? this.parseSpeciesForBulbapedia(basePokemonData.species, basePokemonData.baseForme || basePokemonData.baseSpecies) : '';
    pokemonData.serebiiPage = basePokemonData.num >= 1 ? `https://www.serebii.net/pokedex-sm/${basePokemonData.num}.shtml` : '';
    pokemonData.smogonPage = basePokemonData.num >= 1 ? `https://www.smogon.com/dex/sm/pokemon/${basePokemonData.species.replace(this.replaceSpacesRegex, '-')}` : '';

    if (basePokemonData.num >= 0) {
      if (basePokemonData.forme) {
        const formFlavors = flavors[`${basePokemonData.num}${basePokemonData.forme.toLowerCase()}`];
        for (const formFlavor of formFlavors) {
          pokemonData.flavorTexts.push({ game: formFlavor.version_id, text: formFlavor.flavor_text });
        }
      } else {
        const baseFlavors = flavors[basePokemonData.num];
        for (const baseFlavor of baseFlavors) {
          pokemonData.flavorTexts.push({ game: baseFlavor.version_id, text: baseFlavor.flavor_text });
        }
      }
    }

    if (reverse) {
      pokemonData.flavorTexts.reverse();
    }

    pokemonData.flavorTexts = pokemonData.flavorTexts.slice(skip, skip + take);

    if (basePokemonData.prevo && basePokemonData.prevo !== parsingPokemon) {
      const prevoPokemon = this.findBySpecies(basePokemonData.prevo);
      if (prevoPokemon) {
        preevolutionChain.push(this.findBySpeciesWithDetails({
          query: prevoPokemon.species,
          skip,
          take,
          reverse,
        }, basePokemonData.species));
      }
    }

    if (basePokemonData.evos && basePokemonData.evos[0] !== parsingPokemon) {
      const evoPokemon = this.findBySpecies(basePokemonData.evos[0]);
      if (evoPokemon) {
        evolutionChain.push(this.findBySpeciesWithDetails({
          query: evoPokemon.species,
          skip,
          take,
          reverse,
        }, basePokemonData.species));
      }
    }

    pokemonData.preevolutions = await Promise.all(preevolutionChain);
    pokemonData.evolutions = await Promise.all(evolutionChain);

    return pokemonData;
  }

  private getFullGenderName(gender: Pokemon.DexEntry['gender']): Pokemon.GendersUnion {
    switch (gender) {
      case 'F':
        return 'Female';
      case 'M':
        return 'Male';
      case 'N':
        return 'None';
      default:
        return 'Unknown';
    }
  }

  private parseGenderRatio(genderRatio: Pokemon.GenderRatio) {
    type genders = Exclude<Pokemon.DexEntry['gender'], undefined | 'N'>;
    const parsedGenderRatios = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const objectKeys = Object.keys(genderRatio) as genders[];

    let amountOfKeys = objectKeys.length;
    let key: genders;
    while (amountOfKeys--) {
      key = objectKeys[amountOfKeys];
      parsedGenderRatios[this.getFullGenderName(key)] = `${genderRatio[key] * 100}%`;
    }

    return parsedGenderRatios;
  }

  private parseSpeciesForBulbapedia(pokemonName: string, baseForme?: string) {
    if (baseForme) {
      pokemonName = baseForme.replace(this.replaceSpacesRegex, '_');
    }

    return `https://bulbapedia.bulbagarden.net/wiki/${pokemonName}_(Pokemon)`;
  }
}
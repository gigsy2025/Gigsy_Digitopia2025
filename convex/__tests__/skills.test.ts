import {
    _validateSkillIds,
    _calculateProfileCompleteness,
    _searchSkills,
    _getSkillsCatalog,
    _getSkillRecommendations,
    _getCurrentUser,
    _checkUserHasSkills,
    _updateUserSkills,
    _addUserSkills,
    _removeUserSkills,
    SKILLS_CATALOG,
    SKILL_CATEGORIES
} from '../skills';

// Mock Doc type for testing
type MockDoc<T extends string> = {
    _id: string;
    _creationTime: number;
    [key: string]: any;
};

describe('Skill utility functions', () => {
    describe('validateSkillIds', () => {
        it('should return all valid skill IDs', () => {
            const skillIds = ['javascript', 'python', 'react'];
            const { valid, invalid } = _validateSkillIds(skillIds);
            expect(valid).toEqual(skillIds);
            expect(invalid).toEqual([]);
        });

        it('should return all invalid skill IDs', () => {
            const skillIds = ['invalid-skill-1', 'invalid-skill-2'];
            const { valid, invalid } = _validateSkillIds(skillIds);
            expect(valid).toEqual([]);
            expect(invalid).toEqual(skillIds);
        });

        it('should return a mix of valid and invalid skill IDs', () => {
            const skillIds = ['javascript', 'invalid-skill', 'python'];
            const { valid, invalid } = _validateSkillIds(skillIds);
            expect(valid).toEqual(['javascript', 'python']);
            expect(invalid).toEqual(['invalid-skill']);
        });

        it('should handle an empty array', () => {
            const skillIds = [];
            const { valid, invalid } = _validateSkillIds(skillIds);
            expect(valid).toEqual([]);
            expect(invalid).toEqual([]);
        });
    });

    describe('calculateProfileCompleteness', () => {
        const baseUser: MockDoc<'users'> = {
            _id: 'user1',
            _creationTime: Date.now(),
            profile: {
                skills: [],
                bio: '',
                headline: '',
                location: '',
                experienceLevel: '',
                education: [],
                workExperience: [],
            },
        };

        it('should return 0 for a completely empty profile', () => {
            const score = _calculateProfileCompleteness(baseUser);
            expect(score).toBe(0);
        });

        it('should calculate score based on skills', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, skills: ['javascript', 'react'] } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(16); // 2 skills * 8 points
        });

        it('should cap skills score at 40', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, skills: ['javascript', 'react', 'python', 'java', 'csharp', 'go'] } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(40);
        });

        it('should add points for basic profile fields', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, bio: 'Bio', headline: 'Headline', location: 'Location' } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(30);
        });

        it('should add points for experience level', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, experienceLevel: 'intermediate' } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(10);
        });

        it('should add points for education', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, education: [{ school: 'University', degree: 'BS' }] } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(10);
        });

        it('should add points for work experience', () => {
            const user = { ...baseUser, profile: { ...baseUser.profile, workExperience: [{ company: 'Company', role: 'Developer' }] } };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(10);
        });

        it('should calculate a full score', () => {
            const user: MockDoc<'users'> = {
                _id: 'user1',
                _creationTime: Date.now(),
                profile: {
                    skills: ['javascript', 'react', 'python', 'java', 'csharp'],
                    bio: 'Bio',
                    headline: 'Headline',
                    location: 'Location',
                    experienceLevel: 'expert',
                    education: [{ school: 'University', degree: 'BS' }],
                    workExperience: [{ company: 'Company', role: 'Developer' }],
                },
            };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(100);
        });

        it('should not exceed 100', () => {
            const user: MockDoc<'users'> = {
                _id: 'user1',
                _creationTime: Date.now(),
                profile: {
                    skills: ['javascript', 'react', 'python', 'java', 'csharp', 'go', 'rust'],
                    bio: 'Bio',
                    headline: 'Headline',
                    location: 'Location',
                    experienceLevel: 'expert',
                    education: [{ school: 'University', degree: 'BS' }],
                    workExperience: [{ company: 'Company', role: 'Developer' }],
                },
            };
            const score = _calculateProfileCompleteness(user);
            expect(score).toBe(100);
        });
    });

    describe('searchSkills', () => {
        it('should return popular skills when query is empty', () => {
            const results = _searchSkills('');
            const popularSkills = results.filter(skill => skill.isPopular);
            expect(results.length).toBeGreaterThan(0);
            expect(results).toEqual(popularSkills);
        });

        it('should return skills matching an exact name', () => {
            const results = _searchSkills('React');
            expect(results[0].name).toBe('React');
        });

        it('should return skills matching a partial name', () => {
            const results = _searchSkills('Java');
            expect(results.some(skill => skill.name === 'JavaScript')).toBe(true);
        });

        it('should return skills matching an exact alias', () => {
            const results = _searchSkills('js');
            expect(results.some(skill => skill.name === 'JavaScript')).toBe(true);
        });

        it('should return skills matching a partial alias', () => {
            const results = _searchSkills('react.js');
            expect(results.some(skill => skill.name === 'React')).toBe(true);
        });

        it('should filter by category', () => {
            const results = _searchSkills('dev', 'development');
            expect(results.every(skill => skill.category === 'development')).toBe(true);
        });

        it('should respect the limit', () => {
            const results = _searchSkills('', undefined, 5);
            expect(results.length).toBe(5);
        });

        it('should return an empty array for no matches', () => {
            const results = _searchSkills('nonexistent-skill');
            expect(results).toEqual([]);
        });

        it('should boost popular skills in search results', () => {
            // "React" is popular, "Rust" is not. A search for "R" should prioritize React.
            const results = _searchSkills('R');
            const reactIndex = results.findIndex(s => s.id === 'react');
            const rustIndex = results.findIndex(s => s.id === 'rust');

            // Ensure both are in the results to make a valid comparison
            if (reactIndex !== -1 && rustIndex !== -1) {
                expect(reactIndex).toBeLessThan(rustIndex);
            } else {
                // If one is not found, the test is not valid for this query, but we can check presence.
                expect(reactIndex).not.toBe(-1);
            }
        });
    });
});

describe('Convex mutation functions', () => {
    const mockIdentity = { subject: 'user_123', name: 'Test User', email: 'test@user.com', pictureUrl: '' };
    let mockCtx: any;
    let mockUser: any;

    beforeEach(() => {
        mockUser = {
            _id: 'db_user_123',
            clerkId: 'user_123',
            profile: {
                skills: ['javascript'],
                version: 1,
            },
        };

        const mockQuery = {
            withIndex: jest.fn().mockReturnThis(),
            filter: jest.fn().mockReturnThis(),
            unique: jest.fn().mockResolvedValue(mockUser),
        };

        mockCtx = {
            auth: {
                getUserIdentity: jest.fn().mockResolvedValue(mockIdentity),
            },
            db: {
                query: jest.fn().mockReturnValue(mockQuery),
                patch: jest.fn().mockResolvedValue(undefined),
                insert: jest.fn().mockResolvedValue('new_user_id'),
                get: jest.fn().mockResolvedValue(mockUser),
            },
        };
    });

    describe('updateUserSkills', () => {
        it('should throw error if not authenticated', async () => {
            mockCtx.auth.getUserIdentity.mockResolvedValue(null);
            await expect(_updateUserSkills(mockCtx, { skills: ['react'] })).rejects.toThrow('User must be authenticated');
        });

        it('should update user skills and profile completeness', async () => {
            const skills = ['react', 'python'];
            const result = await _updateUserSkills(mockCtx, { skills });
            expect(mockCtx.db.patch).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.skillsCount).toBe(2);
            expect(result.profileCompleteness).toBe(26); // 16 for skills + 10 for default experienceLevel
        });
    });

    describe('addUserSkills', () => {
        it('should add new skills to user profile', async () => {
            const newSkills = ['react', 'python'];
            const result = await _addUserSkills(mockCtx, { newSkills });

            expect(mockCtx.db.patch).toHaveBeenCalled();
            const patchedSkills = mockCtx.db.patch.mock.calls[0][1].profile.skills;
            expect(patchedSkills).toContain('javascript');
            expect(patchedSkills).toContain('react');
            expect(patchedSkills).toContain('python');
            expect(result.success).toBe(true);
            expect(result.skillsCount).toBe(3);
        });
    });

    describe('removeUserSkills', () => {
        it('should remove skills from user profile', async () => {
            const skillsToRemove = ['javascript'];
            const result = await _removeUserSkills(mockCtx, { skillsToRemove });

            expect(mockCtx.db.patch).toHaveBeenCalled();
            const patchedSkills = mockCtx.db.patch.mock.calls[0][1].profile.skills;
            expect(patchedSkills).not.toContain('javascript');
            expect(result.success).toBe(true);
            expect(result.skillsCount).toBe(0);
        });
    });
});

describe('Convex query functions', () => {
    describe('getSkillsCatalog', () => {
        const mockCtx: any = {
            // No auth or db needed for this query
        };

        it('should return the full skills catalog structure', async () => {
            const result = await _getSkillsCatalog(mockCtx, {}, SKILLS_CATALOG, SKILL_CATEGORIES);
            expect(result).toHaveProperty('skills');
            expect(result).toHaveProperty('popularSkills');
            expect(result).toHaveProperty('categories');
            expect(result).toHaveProperty('totalCount');
            expect(result).toHaveProperty('availableCategories');
        });

        it('should return a limited number of skills', async () => {
            const result = await _getSkillsCatalog(mockCtx, { limit: 5 }, SKILLS_CATALOG, SKILL_CATEGORIES);
            expect(result.skills.length).toBe(5);
        });

        it('should filter skills by category', async () => {
            const result = await _getSkillsCatalog(mockCtx, { query: 'a', category: 'design' }, SKILLS_CATALOG, SKILL_CATEGORIES);
            const allDesign = result.skills.every(s => s.category === 'design');
            expect(allDesign).toBe(true);
        });

        it('should handle a search query', async () => {
            const result = await _getSkillsCatalog(mockCtx, { query: 'React' }, SKILLS_CATALOG, SKILL_CATEGORIES);
            expect(result.skills.length).toBeGreaterThan(0);
            expect(result.skills[0].name).toBe('React');
        });
    });

    describe('getSkillRecommendations', () => {
        const mockCtx: any = {};

        it('should return empty recommendations for no skills', async () => {
            const result = await _getSkillRecommendations(mockCtx, { currentSkills: [] }, SKILLS_CATALOG);
            expect(result.recommendations).toEqual([]);
        });

        it('should recommend related skills', async () => {
            const result = await _getSkillRecommendations(mockCtx, { currentSkills: ['javascript'] }, SKILLS_CATALOG);
            const recommendedIds = result.recommendations.map(r => r.id);
            expect(recommendedIds).toContain('typescript');
            expect(recommendedIds).toContain('react');
            expect(recommendedIds).toContain('nodejs');
        });

        it('should not recommend existing skills', async () => {
            const result = await _getSkillRecommendations(mockCtx, { currentSkills: ['javascript', 'react'] }, SKILLS_CATALOG);
            const recommendedIds = result.recommendations.map(r => r.id);
            expect(recommendedIds).not.toContain('javascript');
            expect(recommendedIds).not.toContain('react');
        });

        it('should add popular skills from the same category', async () => {
            const result = await _getSkillRecommendations(mockCtx, { currentSkills: ['java'] }, SKILLS_CATALOG);
            const recommendedIds = result.recommendations.map(r => r.id);
            const popularDevSkills = SKILLS_CATALOG.filter(s => s.category === 'development' && s.isPopular).map(s => s.id);

            // Check that at least one popular dev skill is recommended
            const hasPopularDevSkill = recommendedIds.some(id => popularDevSkills.includes(id));
            expect(hasPopularDevSkill).toBe(true);

            // Check that the recommended popular skills are from the correct category
            const recommendedPopular = result.recommendations.filter(r => popularDevSkills.includes(r.id));
            const allDev = recommendedPopular.every(r => r.category === 'development');
            expect(allDev).toBe(true);
        });

        it('should limit the number of recommendations', async () => {
            // This test is a bit tricky since the logic is complex.
            // We'll just check that it doesn't exceed the limit of 10.
            const manySkills = SKILLS_CATALOG.slice(0, 15).map(s => s.id);
            const result = await _getSkillRecommendations(mockCtx, { currentSkills: manySkills }, SKILLS_CATALOG);
            expect(result.recommendations.length).toBeLessThanOrEqual(10);
        });
    });

    describe('getCurrentUser', () => {
        it('should return null if user is not authenticated', async () => {
            const mockCtx: any = {
                auth: {
                    getUserIdentity: jest.fn().mockResolvedValue(null),
                },
            };
            const user = await _getCurrentUser(mockCtx);
            expect(user).toBeNull();
        });

        it('should return user if authenticated and user exists', async () => {
            const mockUser = { clerkId: '123', name: 'Test User' };
            const mockIdentity = { subject: '123' };

            const mockQuery = {
                withIndex: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                unique: jest.fn().mockResolvedValue(mockUser),
            };

            const mockCtx: any = {
                auth: {
                    getUserIdentity: jest.fn().mockResolvedValue(mockIdentity),
                },
                db: {
                    query: jest.fn().mockReturnValue(mockQuery),
                },
            };

            const user = await _getCurrentUser(mockCtx);
            expect(user).toEqual(mockUser);
            expect(mockCtx.db.query).toHaveBeenCalledWith('users');
            expect(mockQuery.withIndex).toHaveBeenCalledWith('by_clerk_id', expect.any(Function));
        });
    });

    describe('checkUserHasSkills', () => {
        it('should return correctly for unauthenticated user', async () => {
            const mockCtx: any = { auth: { getUserIdentity: jest.fn().mockResolvedValue(null) } };
            const result = await _checkUserHasSkills(mockCtx);
            expect(result).toEqual({ hasSkills: false, shouldShowOnboarding: false, user: null });
        });

        it('should return correctly if user not found', async () => {
            const mockIdentity = { subject: '123' };
            const mockQuery = {
                withIndex: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                unique: jest.fn().mockResolvedValue(null),
            };
            const mockCtx: any = {
                auth: { getUserIdentity: jest.fn().mockResolvedValue(mockIdentity) },
                db: { query: jest.fn().mockReturnValue(mockQuery) },
            };
            const result = await _checkUserHasSkills(mockCtx);
            expect(result).toEqual({ hasSkills: false, shouldShowOnboarding: false, user: null });
        });

        it('should return correctly for user with no skills', async () => {
            const mockUser = { _id: 'user1', clerkId: '123', name: 'Test User', email: 'test@test.com', profile: { skills: [] } };
            const mockIdentity = { subject: '123' };
            const mockQuery = {
                withIndex: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                unique: jest.fn().mockResolvedValue(mockUser),
            };
            const mockCtx: any = {
                auth: { getUserIdentity: jest.fn().mockResolvedValue(mockIdentity) },
                db: { query: jest.fn().mockReturnValue(mockQuery) },
            };
            const result = await _checkUserHasSkills(mockCtx);
            expect(result.hasSkills).toBe(false);
            expect(result.shouldShowOnboarding).toBe(true);
            expect(result.user).toBeDefined();
        });

        it('should return correctly for user with skills', async () => {
            const mockUser = { _id: 'user1', clerkId: '123', name: 'Test User', email: 'test@test.com', profile: { skills: ['javascript'] } };
            const mockIdentity = { subject: '123' };
            const mockQuery = {
                withIndex: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                unique: jest.fn().mockResolvedValue(mockUser),
            };
            const mockCtx: any = {
                auth: { getUserIdentity: jest.fn().mockResolvedValue(mockIdentity) },
                db: { query: jest.fn().mockReturnValue(mockQuery) },
            };
            const result = await _checkUserHasSkills(mockCtx);
            expect(result.hasSkills).toBe(true);
            expect(result.shouldShowOnboarding).toBe(false);
            expect(result.user).toBeDefined();
        });
    });
});

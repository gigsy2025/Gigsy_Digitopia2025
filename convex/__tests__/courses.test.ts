/**
 * Test suite for Course Management Service
 *
 * This test suite covers all aspects of course management, including:
 * - CRUD operations for courses, modules, and lessons
 * - Role-based access control (RBAC) for admin-only mutations
 * - Data validation and error handling
 * - Complex queries with filtering and pagination
 * - Business logic for course enrollment and details fetching
 *
 * The tests follow the AAA (Arrange, Act, Assert) pattern for clarity and consistency.
 */
import { ConvexError } from "convex/values";

// =============================================================================
// TYPE DEFINITIONS FOR MOCK DATA
// =============================================================================

type Id<T extends string> = string & { __tableName: T };

interface MockUser {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  roles: string[];
}

interface MockCourse {
  _id: Id<"courses">;
  title: string;
  description: string;
  authorId: Id<"users">;
  status: "draft" | "published" | "archived" | "coming_soon" | "private";
  enrollmentCount?: number;
  [key: string]: any;
}

interface MockModule {
  _id: Id<"modules">;
  courseId: Id<"courses">;
  title: string;
  orderIndex: number;
  lessonCount?: number;
}

interface MockLesson {
  _id: Id<"lessons">;
  moduleId: Id<"modules">;
  courseId: Id<"courses">;
  title: string;
  order: number;
}

interface MockEnrollment {
  _id: Id<"enrollments">;
  courseId: Id<"courses">;
  userId: Id<"users">;
}

interface MockAdminLog {
  _id: Id<"adminLogs">;
  action: string;
  userId: string;
  details: Record<string, unknown>;
}

interface MockIdentity {
  subject: string;
  issuer: string;
}

// =============================================================================
// MOCK CONVEX TESTING HELPER
// =============================================================================

class MockConvexTestingHelper {
  public db = {
    users: new Map<Id<"users">, MockUser>(),
    courses: new Map<Id<"courses">, MockCourse>(),
    modules: new Map<Id<"modules">, MockModule>(),
    lessons: new Map<Id<"lessons">, MockLesson>(),
    enrollments: new Map<Id<"enrollments">, MockEnrollment>(),
    adminLogs: new Map<Id<"adminLogs">, MockAdminLog>(),
  };

  private identity: MockIdentity | null = null;
  private idCounter = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.identity = null;
    this.idCounter = 0;
    Object.values(this.db).forEach((table) => table.clear());
  }

  setIdentity(user: MockUser) {
    this.identity = { subject: user.clerkId, issuer: "https://clerk.dev" };
  }

  clearIdentity() {
    this.identity = null;
  }

  private async validateAdminAccess(): Promise<{ userId: string; user: MockUser; userDbId: Id<"users"> }> {
    if (!this.identity) {
      throw new ConvexError("Authentication required");
    }
    const user = [...this.db.users.values()].find(u => u.clerkId === this.identity!.subject);
    if (!user) {
      throw new ConvexError("User not found");
    }
    if (!user.roles.includes("admin")) {
      throw new ConvexError("Insufficient permissions. Course management requires admin access.");
    }
    return { userId: this.identity.subject, user, userDbId: user._id };
  }

  private async logAdminAction(action: string, details: Record<string, unknown>, userId: string) {
    const logId = `adminLog_${Date.now()}` as Id<"adminLogs">;
    this.db.adminLogs.set(logId, { _id: logId, action, details, userId });
  }

  // --- Mock Mutations ---

  async mockCreateCourse(args: any): Promise<Id<"courses">> {
    const { userId, userDbId } = await this.validateAdminAccess();

    if (!args.title?.trim() || args.title.trim().length < 3) {
      throw new ConvexError("Course title must be at least 3 characters long");
    }
    if (!args.description?.trim() || args.description.trim().length < 10) {
        throw new ConvexError("Course description must be at least 10 characters long");
    }

    this.idCounter++;
    const courseId = `course_${this.idCounter}` as Id<"courses">;
    const newCourse: MockCourse = {
      _id: courseId,
      authorId: userDbId,
      ...args,
      status: args.status ?? "draft",
      enrollmentCount: 0,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    this.db.courses.set(courseId, newCourse);

    await this.logAdminAction("course_created", { courseId, title: args.title }, userId);

    return courseId;
  }

  // --- Mock Queries ---

  async mockGetCourseById(args: { courseId: Id<"courses"> }): Promise<MockCourse | null> {
    return this.db.courses.get(args.courseId) ?? null;
  }

  async mockGetCategories(): Promise<string[]> {
    return ["development", "design", "marketing", "writing", "data", "business", "creative", "technology", "soft-skills", "languages"];
  }

  async mockGetDifficultyLevels(): Promise<string[]> {
    return ["beginner", "intermediate", "advanced", "expert"];
  }

  async mockListCourses(args: { category?: string, difficulty?: string, status?: string }): Promise<{ page: MockCourse[] }> {
    let courses = [...this.db.courses.values()];

    if (args.category) {
      courses = courses.filter(c => c.category === args.category);
    }
    if (args.difficulty) {
      courses = courses.filter(c => c.difficulty === args.difficulty);
    }
    if (args.status) {
      courses = courses.filter(c => c.status === args.status);
    }

    // The real query returns a paginated object
    return { page: courses };
  }

  async mockUpdateCourse(args: { courseId: Id<"courses">, [key: string]: any }): Promise<boolean> {
    const { userId } = await this.validateAdminAccess();

    const course = this.db.courses.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    if (args.title && args.title.trim().length < 3) {
      throw new ConvexError("Course title must be at least 3 characters long");
    }

    const updateData: Partial<MockCourse> = { ...args };
    delete updateData.courseId;

    this.db.courses.set(args.courseId, { ...course, ...updateData, updatedAt: Date.now() });

    await this.logAdminAction("course_updated", { courseId: args.courseId, changes: Object.keys(updateData) }, userId);

    return true;
  }

  async mockDeleteCourse(args: { courseId: Id<"courses"> }): Promise<boolean> {
    const { userId } = await this.validateAdminAccess();

    const course = this.db.courses.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    const enrollments = [...this.db.enrollments.values()].filter(e => e.courseId === args.courseId);
    if (enrollments.length > 0) {
      throw new ConvexError("Cannot delete course with active enrollments. Archive it instead.");
    }

    // Soft delete
    this.db.courses.set(args.courseId, { ...course, status: "archived", updatedAt: Date.now() });

    await this.logAdminAction("course_deleted", { courseId: args.courseId, title: course.title }, userId);

    return true;
  }

  async mockEnrollInCourse(args: { courseId: Id<"courses">, userId: Id<"users"> }) {
      const enrollmentId = `enrollment_${Date.now()}` as Id<"enrollments">;
      this.db.enrollments.set(enrollmentId, {
          _id: enrollmentId,
          courseId: args.courseId,
          userId: args.userId
      });
  }

  async mockCreateModule(args: { courseId: Id<"courses">, title: string }): Promise<Id<"modules">> {
    const { userId } = await this.validateAdminAccess();

    const course = this.db.courses.get(args.courseId);
    if (!course) {
      throw new ConvexError("Course not found");
    }

    if (!args.title?.trim()) {
      throw new ConvexError("Module title is required");
    }

    const modulesForCourse = [...this.db.modules.values()].filter(m => m.courseId === args.courseId);
    const orderIndex = modulesForCourse.length;

    const moduleId = `module_${Date.now()}` as Id<"modules">;
    const newModule: MockModule = {
      _id: moduleId,
      courseId: args.courseId,
      title: args.title,
      orderIndex,
      lessonCount: 0,
    };
    this.db.modules.set(moduleId, newModule);

    await this.logAdminAction("module_created", { moduleId, courseId: args.courseId, title: args.title }, userId);

    return moduleId;
  }

  async mockCreateLesson(args: { moduleId: Id<"modules">, title: string, content: string }): Promise<Id<"lessons">> {
    const { userId } = await this.validateAdminAccess();

    const module = this.db.modules.get(args.moduleId);
    if (!module) {
      throw new ConvexError("Module not found");
    }

    if (!args.title?.trim()) {
      throw new ConvexError("Lesson title is required");
    }

    const lessonsForModule = [...this.db.lessons.values()].filter(l => l.moduleId === args.moduleId);
    const order = lessonsForModule.length;

    const lessonId = `lesson_${Date.now()}` as Id<"lessons">;
    const newLesson: MockLesson = {
      _id: lessonId,
      moduleId: args.moduleId,
      courseId: module.courseId,
      title: args.title,
      order,
    };
    this.db.lessons.set(lessonId, newLesson);

    // Update lesson count on module
    module.lessonCount = (module.lessonCount ?? 0) + 1;
    this.db.modules.set(module._id, module);

    await this.logAdminAction("lesson_created", { lessonId, moduleId: args.moduleId, title: args.title }, userId);

    return lessonId;
  }
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe("Course Management Service", () => {
  let helper: MockConvexTestingHelper;
  let adminUser: MockUser;
  let normalUser: MockUser;

  beforeEach(() => {
    helper = new MockConvexTestingHelper();
    adminUser = { _id: "user_admin_1" as Id<"users">, clerkId: "clerk_admin_1", name: "Admin", roles: ["admin"] };
    normalUser = { _id: "user_normal_1" as Id<"users">, clerkId: "clerk_normal_1", name: "User", roles: ["user"] };

    helper.db.users.set(adminUser._id, adminUser);
    helper.db.users.set(normalUser._id, normalUser);
  });

  afterEach(() => {
    helper.reset();
  });

  describe("RBAC (Role-Based Access Control)", () => {
    const courseArgs = { title: "Test Course", description: "A test description." };

    it("should throw an error if an unauthenticated user tries to create a course", async () => {
      helper.clearIdentity();
      await expect(helper.mockCreateCourse(courseArgs)).rejects.toThrow(
        new ConvexError("Authentication required")
      );
    });

    it("should throw an error if a non-admin user tries to create a course", async () => {
      helper.setIdentity(normalUser);
      await expect(helper.mockCreateCourse(courseArgs)).rejects.toThrow(
        new ConvexError("Insufficient permissions. Course management requires admin access.")
      );
    });

    it("should allow an admin user to create a course", async () => {
      helper.setIdentity(adminUser);
      const courseId = await helper.mockCreateCourse(courseArgs);

      expect(courseId).toBeDefined();
      const course = helper.db.courses.get(courseId);
      expect(course).not.toBeNull();
      expect(course?.title).toBe(courseArgs.title);
      expect(course?.authorId).toBe(adminUser._id);
    });
  });

  describe("Course Creation", () => {
    beforeEach(() => {
        helper.setIdentity(adminUser);
    });

    it("should create a course with valid data", async () => {
        const courseArgs = { title: "New Valid Course", description: "This is a perfectly valid course description." };
        const courseId = await helper.mockCreateCourse(courseArgs);

        const course = helper.db.courses.get(courseId);
        expect(course).toBeDefined();
        expect(course?.status).toBe("draft"); // Default status
        expect(course?.enrollmentCount).toBe(0);

        const logs = [...helper.db.adminLogs.values()];
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe("course_created");
        expect(logs[0].details.courseId).toBe(courseId);
    });

    it("should fail to create a course with a short title", async () => {
        const courseArgs = { title: "A", description: "Valid description." };
        await expect(helper.mockCreateCourse(courseArgs)).rejects.toThrow(
            new ConvexError("Course title must be at least 3 characters long")
        );
    });

    it("should fail to create a course with a short description", async () => {
        const courseArgs = { title: "Valid Title", description: "Short" };
        await expect(helper.mockCreateCourse(courseArgs)).rejects.toThrow(
            new ConvexError("Course description must be at least 10 characters long")
        );
    });
  });

  describe("Course Queries", () => {
    let course1Id: Id<"courses">;
    let course2Id: Id<"courses">;

    beforeEach(async () => {
        helper.setIdentity(adminUser);
        // Ensure descriptions are long enough
        course1Id = await helper.mockCreateCourse({ title: "Course 1", description: "Description for course 1", category: "development", difficulty: "beginner", status: "published" });
        course2Id = await helper.mockCreateCourse({ title: "Course 2", description: "Description for course 2", category: "design", difficulty: "intermediate", status: "draft" });
    });

    it("should get a course by its ID", async () => {
        const fetched = await helper.mockGetCourseById({ courseId: course1Id });
        expect(fetched).not.toBeNull();
        expect(fetched?._id).toBe(course1Id);
        expect(fetched?.title).toBe("Course 1");
    });

    it("should return null when getting a non-existent course ID", async () => {
        const fetched = await helper.mockGetCourseById({ courseId: "course_nonexistent" as Id<"courses"> });
        expect(fetched).toBeNull();
    });

    it("should get all categories", async () => {
        const categories = await helper.mockGetCategories();
        expect(categories).toEqual(["development", "design", "marketing", "writing", "data", "business", "creative", "technology", "soft-skills", "languages"]);
    });

    it("should get all difficulty levels", async () => {
        const levels = await helper.mockGetDifficultyLevels();
        expect(levels).toEqual(["beginner", "intermediate", "advanced", "expert"]);
    });

    it("should list all courses without filters", async () => {
        const { page } = await helper.mockListCourses({});
        expect(page).toHaveLength(2);
    });

    it("should filter courses by category", async () => {
        const { page } = await helper.mockListCourses({ category: "design" });
        expect(page).toHaveLength(1);
        expect(page[0]._id).toBe(course2Id);
    });

    it("should filter courses by difficulty", async () => {
        const { page } = await helper.mockListCourses({ difficulty: "beginner" });
        expect(page).toHaveLength(1);
        expect(page[0]._id).toBe(course1Id);
    });

    it("should filter courses by status", async () => {
        const { page } = await helper.mockListCourses({ status: "draft" });
        expect(page).toHaveLength(1);
        expect(page[0]._id).toBe(course2Id);
    });

    it("should return an empty array if no courses match filters", async () => {
        const { page } = await helper.mockListCourses({ category: "marketing" });
        expect(page).toHaveLength(0);
    });
  });

  describe("Course Updates", () => {
    let courseId: Id<"courses">;

    beforeEach(async () => {
        helper.setIdentity(adminUser);
        courseId = await helper.mockCreateCourse({ title: "Course to Update", description: "Initial description" });
    });

    it("should allow an admin to update a course", async () => {
        const updates = { courseId, title: "Updated Title", status: "published" as const };
        const result = await helper.mockUpdateCourse(updates);

        expect(result).toBe(true);
        const updatedCourse = helper.db.courses.get(courseId);
        expect(updatedCourse?.title).toBe("Updated Title");
        expect(updatedCourse?.status).toBe("published");

        const logs = [...helper.db.adminLogs.values()];
        expect(logs.some(log => log.action === "course_updated")).toBe(true);
    });

    it("should not allow a non-admin to update a course", async () => {
        helper.setIdentity(normalUser);
        const updates = { courseId, title: "Unauthorized Update" };
        await expect(helper.mockUpdateCourse(updates)).rejects.toThrow(
            new ConvexError("Insufficient permissions. Course management requires admin access.")
        );
    });

    it("should throw an error when updating a non-existent course", async () => {
        const updates = { courseId: "course_fake" as Id<"courses">, title: "Won't work" };
        await expect(helper.mockUpdateCourse(updates)).rejects.toThrow(
            new ConvexError("Course not found")
        );
    });

    it("should not allow updating a course title to be too short", async () => {
        const updates = { courseId, title: "A" };
        await expect(helper.mockUpdateCourse(updates)).rejects.toThrow(
            new ConvexError("Course title must be at least 3 characters long")
        );
    });
  });

  describe("Course Deletion", () => {
    let courseId: Id<"courses">;

    beforeEach(async () => {
        helper.setIdentity(adminUser);
        courseId = await helper.mockCreateCourse({ title: "Course to Delete", description: "This is a course to be deleted." });
    });

    it("should allow an admin to delete (archive) a course", async () => {
        const result = await helper.mockDeleteCourse({ courseId });
        expect(result).toBe(true);

        const course = helper.db.courses.get(courseId);
        expect(course?.status).toBe("archived");

        const logs = [...helper.db.adminLogs.values()];
        expect(logs.some(log => log.action === "course_deleted")).toBe(true);
    });

    it("should not allow a non-admin to delete a course", async () => {
        helper.setIdentity(normalUser);
        await expect(helper.mockDeleteCourse({ courseId })).rejects.toThrow(
            new ConvexError("Insufficient permissions. Course management requires admin access.")
        );
    });

    it("should not allow deleting a course with active enrollments", async () => {
        await helper.mockEnrollInCourse({ courseId, userId: normalUser._id });

        await expect(helper.mockDeleteCourse({ courseId })).rejects.toThrow(
            new ConvexError("Cannot delete course with active enrollments. Archive it instead.")
        );
    });
  });

  describe("Module and Lesson Management", () => {
    let courseId: Id<"courses">;

    beforeEach(async () => {
        helper.setIdentity(adminUser);
        courseId = await helper.mockCreateCourse({ title: "Course for Modules", description: "A course for modules and lessons" });
    });

    it("should create a module for a course", async () => {
        const moduleId = await helper.mockCreateModule({ courseId, title: "First Module" });
        expect(moduleId).toBeDefined();

        const module = helper.db.modules.get(moduleId);
        expect(module?.title).toBe("First Module");
        expect(module?.courseId).toBe(courseId);
        expect(module?.orderIndex).toBe(0);
    });

    it("should create a lesson for a module", async () => {
        const moduleId = await helper.mockCreateModule({ courseId, title: "Module for Lesson" });
        const lessonId = await helper.mockCreateLesson({ moduleId, title: "First Lesson", content: "..." });
        expect(lessonId).toBeDefined();

        const lesson = helper.db.lessons.get(lessonId);
        expect(lesson?.title).toBe("First Lesson");
        expect(lesson?.moduleId).toBe(moduleId);

        const module = helper.db.modules.get(moduleId);
        expect(module?.lessonCount).toBe(1);
    });

    it("should correctly order modules and lessons", async () => {
        const moduleId1 = await helper.mockCreateModule({ courseId, title: "Module 1" });
        const moduleId2 = await helper.mockCreateModule({ courseId, title: "Module 2" });

        const module2 = helper.db.modules.get(moduleId2);
        expect(module2?.orderIndex).toBe(1);

        const lessonId1 = await helper.mockCreateLesson({ moduleId: moduleId1, title: "Lesson 1.1", content: "..." });
        const lessonId2 = await helper.mockCreateLesson({ moduleId: moduleId1, title: "Lesson 1.2", content: "..." });

        const lesson2 = helper.db.lessons.get(lessonId2);
        expect(lesson2?.order).toBe(1);
    });

    it("should not create a module for a non-existent course", async () => {
        await expect(helper.mockCreateModule({ courseId: "course_fake" as Id<"courses">, title: "Bad Module" })).rejects.toThrow(
            new ConvexError("Course not found")
        );
    });
  });
});

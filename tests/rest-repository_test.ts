import { assertEquals, Stub, stub } from "./test_deps.ts";
import { RESTRepository } from "../rest-repository.ts";
import { Result } from "../result.ts";

const { test } = Deno;

let fetchStub: Stub<Window & typeof globalThis>;

const repositoryContext = (
  callback: (repository: RESTRepository<object>) => void,
  body?: unknown,
  status?: number,
) => {
  return async () => {
    fetchStub = stub(
      window,
      "fetch",
      () =>
        Promise.resolve(
          body !== undefined
            ? new Response(JSON.stringify(body), {
              status: status || 200,
              headers: { "content-type": "application/json" },
            })
            : new Response(undefined, { status: status || 200 }),
        ),
    );
    const repository = new RESTRepository(Object, "/things");
    await callback(repository);
    fetchStub.restore();
  };
};

test(
  "[RESTRepository#constructor] checks if an entity was persisted",
  repositoryContext((repository) => {
    assertEquals(repository instanceof RESTRepository, true);
  }),
);

test(
  "[RESTRepository#has] checks if an entity was persisted",
  repositoryContext(async (repository) => {
    assertEquals(await repository.has({ _id: 1 }), Result.ok(true));
    assertEquals(await repository.has({ _id: null }), Result.ok(false));
    assertEquals(await repository.has({ _id: undefined }), Result.ok(false));
    assertEquals(await repository.has({ _id: false }), Result.ok(false));
    assertEquals(await repository.has({ _id: "" }), Result.ok(false));
    const idRepo = new RESTRepository(
      Object,
      "",
      "id" as unknown as keyof Object,
    );
    assertEquals(await idRepo.has({ _id: 1 }), Result.ok(false));
    assertEquals(await idRepo.has({ id: 1 }), Result.ok(true));
  }),
);

test(
  "[RESTRepository#query] queries an url with optional search parameters",
  repositoryContext(async (repository) => {
    const result = await repository.query<{ a: number }>(
      { a: "1", b: "1" },
      "/abc",
    );
    assertEquals(fetchStub.calls[0].args[0], "/things/abc?a=1&b=1");
    assertEquals(result.ok, true);
    assertEquals(result.value, [{ a: 1 }]);
  }, [{ a: 1 }]),
);

test(
  "[RESTRepository#command]",
  repositoryContext(async (repository) => {
    const body = { a: "1", b: "1" };
    const result = await repository.command<{ a: number }>(body, "/abc");
    assertEquals(fetchStub.calls[0].args, ["/things/abc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }]);
    assertEquals(result.ok, true);
    assertEquals(result.value, [{ a: 1 }]);
  }, [{ a: 1 }]),
);

test(
  "[RESTRepository#list] queries REST endpoint with optional search parameters",
  repositoryContext(async (repository) => {
    await repository.list({ a: "1", b: "1" });
    assertEquals(fetchStub.calls[0].args[0], "/things?a=1&b=1");
  }),
);

test(
  "[RESTRepository#list] queries an endpoint without search parameters",
  repositoryContext(async (repository) => {
    await repository.list();
    assertEquals(fetchStub.calls[0].args[0], "/things");
  }),
);

test(
  "[RESTRepository#list] proxies failed response when fetch fails",
  repositoryContext(
    async (repository) => {
      const result = await repository.list();
      assertEquals(fetchStub.calls[0].args[0], "/things");
      assertEquals(result.ok, false);
      assertEquals(result.value instanceof Response, true);
    },
    undefined,
    404,
  ),
);

test(
  "[RESTRepository#read] fetches entity from endpoint by id",
  repositoryContext(async (repository) => {
    const result = await repository.read("a");
    assertEquals(fetchStub.calls[0].args[0], "/things/a");
    assertEquals(result.ok, true);
    assertEquals(result.value, { _id: "a" });
  }, { _id: "a" }),
);

test(
  "[RESTRepository#read] proxies failed response when fetch fails",
  repositoryContext(
    async (repository) => {
      const result = await repository.read("a");
      assertEquals(fetchStub.calls[0].args[0], "/things/a");
      assertEquals(result.ok, false);
      assertEquals(result.value instanceof Response, true);
    },
    undefined,
    404,
  ),
);

test(
  "[RESTRepository#save] persists a new entity if it does not exist",
  repositoryContext(async (repository) => {
    const request = { a: 1 };
    await repository.save(request);
    assertEquals(fetchStub.calls[0].args, ["/things", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }]);
  }),
);

test(
  "[RESTRepository#save] updates an existing entity",
  repositoryContext(async (repository) => {
    const request = { _id: "a", a: 1 };
    await repository.save(request);
    assertEquals(fetchStub.calls[0].args, ["/things/a", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }]);
  }),
);

test(
  "[RESTRepository#delete] removes an existing entity",
  repositoryContext(async (repository) => {
    await repository.delete("a");
    assertEquals(fetchStub.calls[0].args, ["/things/a", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    }]);
  }),
);

/*
TODO: check the test case
test(
  "[RESTRepository#delete] returns if the entity has not been persisted",
  repositoryContext(async (repository) => {
    const request = { a: 1 };
    fetchStub.returns = [Promise.resolve(Result.ok(undefined))];
    await repository.delete(request.a.toString());
    assertEquals(fetchStub.calls.length, 0);
  }),
); */

test(
  "[RESTRepository.fetch] calls Fetch API supplying default headers",
  repositoryContext(async () => {
    const result = await RESTRepository.fetch("");
    assertEquals(result, Result.ok(undefined));
    assertEquals(fetchStub.calls[0].args, [
      "",
      RESTRepository.init,
    ]);
  }),
);

test(
  "[RESTRepository.fetch] handles redirected response",
  repositoryContext(
    async () => {
      const result = await RESTRepository.fetch("");
      assertEquals(result, Result.ok(undefined));
    },
    undefined,
    304,
  ),
);

test(
  "[RESTRepository.fetch] handles json response",
  repositoryContext(
    async () => {
      const result = await RESTRepository.fetch("");
      assertEquals(result, Result.ok({ a: 1 }));
    },
    { a: 1 },
  ),
);

test(
  "[RESTRepository.fetch] returns Fetch API response if request fails",
  repositoryContext(
    async () => {
      const result = await RESTRepository.fetch("");
      assertEquals(result.ok, false);
      assertEquals(result.value instanceof Response, true);
      assertEquals((result.value as Response).ok, false);
    },
    undefined,
    404,
  ),
);

/*
TODO: add test
test("returns error if Fetch API promise fails" async () => {
  globalThis.fetch = jest.fn(() => Promise.reject("error"));
  const result = await RESTRepository.fetch("");
  assertEquals(result.ok, false);
  assertEquals(result.value, "error");
});
*/

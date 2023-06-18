import type { AssemblyFormResult } from '../sharedTypes'

// TODO check if package.json and package-lock.json both exist

export function assemble(d: AssemblyFormResult): string {

return `# syntax=docker/dockerfile:1
${d.jsBuildStage ? `
FROM node:${d.jsNodeImageTag} AS stage-npm
ENV npm_config_cache="/npm"
WORKDIR /dist

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/npm \\
    npm install

${
    d.jsPathsForBuild.map(path => `COPY ${path} ./${path}`).join('\n')
}

RUN ${d.jsBuildCommand}


###############################################################################
` : ''}
FROM ${d.baseImageName}:${d.baseImageTag} AS prod
WORKDIR /dist

ENV COMPOSER_HOME="/composer" PATH="/composer/vendor/bin:$PATH" COMPOSER_NO_INTERACTION="1" COMPOSER_ALLOW_SUPERUSER="1"
COPY --from=composer/composer:2-bin /composer /usr/local/bin/composer

RUN apk add --no-cache \\
        ${ d.phpPackagesToInstall.join(' \\\n        ') } \\
        ${ d.serverPackagesToInstall.join(' \\\n        ') } \\
    && ln -s ${ d.phpBinaryPath } ${ d.phpBinaryPath.replace(/\/php[^\/]{1,}$/g, '/php') }
    && adduser -D -u 1001 -G root -h /appuser appuser \\
    && mkdir -p /unit/run /unit/state /unit/state/certs /unit/tmp \\
    && find /appuser /unit -exec chown -R appuser:root {} \\; -exec chmod -R g+rwX {} \\;

EXPOSE ${d.serverPort}

COPY <<-EOF /unit/state/conf.json
{
    "listeners": {
        "*:${d.serverPort}": { "pass": "routes" }
    },
    "routes": [{
        "match": {
            "uri": "!/index.php"
        },
        "action": {
            "share": "/dist/${d.documentRoot}${d.serverRouteAppendUri ? '\\$uri' : ''}",
            "fallback": { "pass": "applications/laravel" }
        }
    }],
    "applications": {
        "laravel": {
            "type": "php",
            "script": "${d.frontController}",
            "root": "/dist/${d.documentRoot}",
            "options": { "admin": {
                "upload_max_filesize": "${d.serverRequestSize}M",
                "post_max_size": "${d.serverRequestSize}M",
                "expose_php": "0"
            }},
        }
    },
    "settings": { "http": {
        "max_body_size": ${d.serverRequestSize * 1024 * 1024 }
    }}
}
EOF

COPY --chmod=755 <<-EOF /usr/local/bin/web
#!/bin/sh
echo "IMAGE_VERSION=\\$IMAGE_VERSION"
exec unitd --user appuser --no-daemon --log /dev/stdout \\\\
    --state /unit/state --control unix:/unit/run/unit.sock --pid /unit/run/unit.pid --tmp /unit/tmp
EOF

COPY --chmod=755 <<-EOF /usr/local/bin/artisan
#!/bin/sh
exec php -d memory_limit=-1 /dist/artisan \\$@
EOF

COPY --chmod=755 <<-EOF /usr/local/bin/migrate
#!/bin/sh
echo "IMAGE_VERSION=\\$IMAGE_VERSION"
exec artisan migrate --force \\$@
EOF

COPY --chmod=755 <<-EOF /usr/local/bin/worker
#!/bin/sh
echo "IMAGE_VERSION=\\$IMAGE_VERSION"
exec artisan queue:work \\$@
EOF

LABEL COMMANDS=web,migrate,worker
CMD web
STOPSIGNAL SIGTERM

COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/composer \\
    composer install --no-dev --no-autoloader --no-scripts --no-ansi --no-progress

${
    d.phpPathsForBuild.map(path => `COPY ${path} ./${path}`).join('\n')
}
${
    d.jsBuildStage && d.jsOutPaths.length
        ? d.jsOutPaths.map(path => `COPY --from=stage-npm /dist/${path} ./${path}`).join('\n')  : ''
}

RUN composer dump-autoload --no-dev --optimize${ d.writablePaths.length ? ' \\' : '' }
${ d.writablePaths.length ? `    && find ${ d.writablePaths.map(path => `./${path}`).join(' ') } \\
        -exec chown -R appuser:root {} \\; -exec chmod -R g+rwX {} \\;` : '' }

ARG IMAGE_VERSION
ENV IMAGE_VERSION $IMAGE_VERSION

###############################################################################

FROM prod AS prod-rootless
ENV HOME=/appuser
USER 1001
`

}
